# aggregate_benchmark

Aggregate individual run results into benchmark summary statistics.

## Description

Reads `grading.json` files from run directories and produces:
- `run_summary` with mean, stddev, min, max for each metric
- Delta between `with_skill` and `without_skill` configurations

## Usage

```bash
python aggregate_benchmark.py <benchmark_dir>
```

## Directory Layout

```
<benchmark_dir>/
└── eval-N/
    ├── with_skill/
    │   ├── run-1/grading.json
    │   └── run-2/grading.json
    └── without_skill/
        ├── run-1/grading.json
        └── run-2/grading.json
```

## Integration

This skill is called automatically by `apex-global-orchestrator-unificada` during
benchmark/validation workflows. The orchestrator passes the benchmark directory
and collects the results for reporting.
