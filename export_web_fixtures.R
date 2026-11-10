#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(data.table)
  library(jsonlite)
  library(rhdf5)
})

script_arg <- commandArgs(trailingOnly = FALSE)[grep("^--file=", commandArgs(trailingOnly = FALSE))][[1]]
script_path <- sub("^--file=", "", script_arg)
site_root <- dirname(normalizePath(script_path, mustWork = TRUE))
workspace_root <- dirname(site_root)
release_root <- file.path(workspace_root, "portal-data", "releases", "private-prototype-0.1.0")
output_root <- file.path(site_root, "dist", "data")
dir.create(output_root, recursive = TRUE, showWarnings = FALSE)

gene_panel <- read_json(file.path(site_root, "demo-genes.json"), simplifyVector = TRUE)
genes_requested <- unique(unlist(gene_panel$panels, use.names = FALSE))
stopifnot(identical(genes_requested, gene_panel$genes))

dataset_info <- list(
  liver_broad = list(title = "All liver immune cells", default_gene = "Ptprc"),
  monomac = list(title = "Monocytes & Macrophages", default_gene = "Ccr2"),
  t_cells = list(title = "T-cell expression atlas", default_gene = "Tox"),
  cd8_activated = list(title = "Activated CD8 T cells", default_gene = "Tox")
)

read_sparse_columns <- function(path, requested) {
  var_names <- h5read(path, "var_names")
  missing <- setdiff(requested, var_names)
  if (length(missing)) stop("Requested genes missing from ", path, ": ", paste(missing, collapse = ", "))
  genes <- requested[requested %in% var_names]
  indptr <- as.numeric(h5read(path, "X/indptr"))
  shape <- as.integer(h5read(path, "X/shape"))
  result <- matrix(0, nrow = shape[[1]], ncol = length(genes))
  colnames(result) <- genes
  for (column in seq_along(genes)) {
    gene_index <- match(genes[[column]], var_names)
    start <- indptr[[gene_index]] + 1
    end <- indptr[[gene_index + 1]]
    if (end >= start) {
      rows <- as.integer(h5read(path, "X/indices", index = list(start:end))) + 1L
      values <- as.numeric(h5read(path, "X/data", index = list(start:end)))
      result[rows, column] <- values
    }
  }
  result
}

# Gene-only releases reuse validated cell/clone records. Verify alignment and
# every previously exported expression value before adding any new columns.
refresh_expression_payload <- function(path, cells, expression, dataset_id, annotations, annotation_index, genotype_index) {
  payload <- read_json(path, simplifyVector = FALSE)
  previous <- do.call(rbind, lapply(payload$cells, unlist, use.names = FALSE))
  stopifnot(
    identical(payload$id, dataset_id),
    payload$total_cells == nrow(cells), nrow(previous) == nrow(cells),
    identical(unname(vapply(payload$annotations, function(a) a$name, character(1))), annotations),
    all(previous[, 1] == round(cells$umap_1, 3)),
    all(previous[, 2] == round(cells$umap_2, 3)),
    all(previous[, 3] == annotation_index), all(previous[, 4] == genotype_index)
  )
  previous_genes <- unlist(payload$genes, use.names = FALSE)
  stopifnot(all(previous_genes %in% colnames(expression)))
  stopifnot(all(previous[, 6 + seq_along(previous_genes), drop = FALSE] == round(expression[, previous_genes, drop = FALSE], 3)))
  payload$genes <- colnames(expression)
  payload$columns <- c(unlist(payload$columns, use.names = FALSE)[1:6], colnames(expression))
  payload$cells <- lapply(seq_len(nrow(cells)), function(i) c(previous[i, 1:6], round(expression[i, ], 3)))
  write_json(payload, path, auto_unbox = TRUE, na = "null", null = "null", digits = NA, pretty = FALSE)
  message("Validated all existing expression values and cell annotations; preserved clone records for ", dataset_id)
}

split_cdr3 <- function(value, chain) {
  if (is.na(value) || !nzchar(value)) return(NA_character_)
  pieces <- strsplit(value, ";", fixed = TRUE)[[1]]
  hits <- pieces[startsWith(pieces, paste0(chain, ":"))]
  if (!length(hits)) return(NA_character_)
  paste(sub(paste0("^", chain, ":"), "", hits), collapse = "; ")
}

make_tcr_payload <- function(cells, dataset_id) {
  manifest <- read_json(file.path(release_root, dataset_id, "manifest.json"), simplifyVector = TRUE)
  message("Loading TCR source for ", dataset_id, ": ", manifest$source$rds_path)
  object <- readRDS(manifest$source$rds_path)
  metadata <- object@meta.data
  stopifnot(all(c("group", "sample", "CTaa", "t_cdr3s_aa") %in% names(metadata)))
  keep <- as.character(metadata$group) %in% c("HET_Liver", "DKO_Liver")
  source_ids <- sort(rownames(metadata)[keep])
  metadata <- metadata[source_ids, , drop = FALSE]
  stopifnot(nrow(metadata) == nrow(cells))
  # Validate row identity against the frozen release before attaching clonotypes.
  umap <- object@reductions$umap@cell.embeddings[source_ids, 1:2, drop = FALSE]
  stopifnot(
    identical(as.character(cells$portal_cell_id), sprintf("%s_%06d", toupper(dataset_id), seq_along(source_ids))),
    identical(as.character(metadata$group), as.character(cells$group)),
    identical(as.character(metadata$sample), as.character(cells$sample_source)),
    identical(as.character(metadata[[manifest$annotation$source_column]]), as.character(cells$annotation)),
    max(abs(umap[, 1] - cells$umap_1)) < 1e-7,
    max(abs(umap[, 2] - cells$umap_2)) < 1e-7
  )

  sequence_key <- as.character(metadata$CTaa)
  sequence_key[is.na(sequence_key) | !nzchar(sequence_key)] <- NA_character_
  detected <- !is.na(metadata$t_cdr3s_aa) & nzchar(as.character(metadata$t_cdr3s_aa))
  stopifnot(identical(!is.na(sequence_key), detected), identical(detected, as.logical(cells$tcr_assigned)))
  sample_id <- as.character(metadata$sample)
  clone_key <- ifelse(is.na(sequence_key), NA_character_, paste(sample_id, sequence_key, sep = "::"))
  valid_keys <- clone_key[!is.na(clone_key)]
  totals <- sort(table(valid_keys), decreasing = TRUE)
  ordered_keys <- names(totals)
  clone_index <- match(clone_key, ordered_keys) - 1L
  clone_index[is.na(clone_index)] <- -1L

  clones <- lapply(seq_along(ordered_keys), function(index) {
    key <- ordered_keys[[index]]
    row <- which(clone_key == key)[[1]]
    raw_cdr3 <- as.character(metadata$t_cdr3s_aa[[row]])
    list(
      id = sprintf("Clone %03d", index),
      sample = sample_id[[row]],
      genotype = as.character(cells$genotype[[row]]),
      cells = unname(as.integer(totals[[key]])),
      cdr3_alpha = split_cdr3(raw_cdr3, "TRA"),
      cdr3_beta = split_cdr3(raw_cdr3, "TRB")
    )
  })
  stopifnot(identical(ordered_keys[clone_index[clone_index >= 0L] + 1L], clone_key[clone_index >= 0L]))
  expansion <- as.character(cells$expansion_class)
  if (dataset_id == "t_cells") {
    stopifnot("cloneSize" %in% names(metadata))
    raw_size <- as.character(metadata$cloneSize)
    category <- sub("[[:space:]]*\\(.*$", "", raw_size)
    unexpected <- setdiff(unique(category[!is.na(category) & nzchar(category)]), c("Small", "Rare", "None", "Medium", "Large"))
    if (length(unexpected)) stop("Unreviewed cloneSize category: ", paste(unexpected, collapse = ", "))
    expansion <- ifelse(is.na(category) | !nzchar(category) | category %in% c("Small", "Rare", "None") | !detected, "Unexpanded", category)
    stopifnot(all(expansion %in% c("Unexpanded", "Medium", "Large")))
    message("Total T-cell cloneSize display groups: ", paste(names(table(expansion)), table(expansion), collapse = "; "))
  }
  message("Validated ", nrow(cells), " aligned cells; ", sum(detected), " TCR assigned; ", length(clones), " sample-specific clones")
  list(clone_index = clone_index, clones = clones, expansion = expansion)
}

requested_datasets <- commandArgs(trailingOnly = TRUE)
genes_only <- "--genes-only" %in% requested_datasets
requested_datasets <- setdiff(requested_datasets, "--genes-only")
if (!length(requested_datasets)) requested_datasets <- names(dataset_info)
stopifnot(all(requested_datasets %in% names(dataset_info)))
for (dataset_id in requested_datasets) {
  dataset_dir <- file.path(release_root, dataset_id)
  cells <- fread(file.path(dataset_dir, "cells.csv.gz"))
  expression <- read_sparse_columns(file.path(dataset_dir, "expression-csc.h5"), genes_requested)
  stopifnot(nrow(cells) == nrow(expression))

  # Keep the frozen source annotation intact for identity validation below.
  # Only the website display combines the two activated CD8 populations.
  display_annotation <- as.character(cells$annotation)
  if (dataset_id == "t_cells") {
    display_annotation[display_annotation %in% c("GZMK+ CD8+ Tex", "KLRG1+ CD8+ Teff")] <- "Activated CD8+ T cells"
  }
  annotations <- unique(display_annotation)
  annotation_index <- match(display_annotation, annotations) - 1L
  genotype_index <- ifelse(cells$genotype == "DKO", 1L, 0L)
  if (genes_only) {
    output_path <- file.path(output_root, paste0(dataset_id, ".json"))
    refresh_expression_payload(output_path, cells, expression, dataset_id, annotations, annotation_index, genotype_index)
    cat(sprintf("WROTE\t%s\t%d cells\t%d genes\n", output_path, nrow(cells), ncol(expression)))
    next
  }
  tcr <- NULL
  clone_index <- rep(-1L, nrow(cells))
  if (dataset_id %in% c("cd8_activated", "t_cells")) {
    tcr <- make_tcr_payload(cells, dataset_id)
    clone_index <- tcr$clone_index
  }
  expansion_values <- if (is.null(tcr)) as.character(cells$expansion_class) else tcr$expansion
  expansion_values[is.na(expansion_values) | !nzchar(expansion_values)] <- "No TCR detected"
  expansion_levels <- if (dataset_id == "t_cells") c("Unexpanded", "Medium", "Large") else unique(expansion_values)
  expansion_index <- match(expansion_values, expansion_levels) - 1L

  annotation_records <- lapply(seq_along(annotations), function(index) {
    mask <- display_annotation == annotations[[index]]
    list(
      name = annotations[[index]],
      x = round(median(cells$umap_1[mask]), 3),
      y = round(median(cells$umap_2[mask]), 3),
      cells = sum(mask),
      control = sum(mask & cells$genotype == "HET"),
      aih = sum(mask & cells$genotype == "DKO")
    )
  })

  rows <- vector("list", nrow(cells))
  for (index in seq_len(nrow(cells))) {
    rows[[index]] <- c(
      round(cells$umap_1[[index]], 3),
      round(cells$umap_2[[index]], 3),
      annotation_index[[index]],
      genotype_index[[index]],
      expansion_index[[index]],
      clone_index[[index]],
      round(expression[index, ], 3)
    )
  }

  payload <- list(
    release = "private-prototype-0.1.0",
    id = dataset_id,
    title = dataset_info[[dataset_id]]$title,
    total_cells = nrow(cells),
    default_gene = dataset_info[[dataset_id]]$default_gene,
    genes = colnames(expression),
    annotations = annotation_records,
    expansion_levels = expansion_levels,
    columns = c("umap_1", "umap_2", "annotation", "genotype", "expansion", "clone", colnames(expression)),
    cells = rows
  )
  if (!is.null(tcr)) payload$clones <- tcr$clones

  output_path <- file.path(output_root, paste0(dataset_id, ".json"))
  write_json(payload, output_path, auto_unbox = TRUE, na = "null", digits = NA, pretty = FALSE)
  cat(sprintf("WROTE\t%s\t%d cells\t%d genes\n", output_path, nrow(cells), ncol(expression)))
}
