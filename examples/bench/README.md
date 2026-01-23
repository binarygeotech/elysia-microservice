# Elysia vs NestJS Microservices Benchmark

Compare performance between Elysia Microservices and NestJS Microservices using a simple echo pattern.

## Setup

```bash
cd examples/bench
bun install
```

## Running the Benchmark

### Terminal 1: Start Elysia Echo Server
```bash
bun run elysia
```

### Terminal 2: Run Benchmark Against Elysia
```bash
bun run bench:elysia
```

Or for custom parameters:
```bash
bun run-bench.ts --target=elysia --concurrency=100 --duration=30 --payload=200
```

### To Compare with NestJS:

#### Terminal 1: Start NestJS Echo Server
```bash
bun run nest
```

#### Terminal 2: Run Benchmark Against NestJS
```bash
bun run bench:nest
```

## Parameters

- `--target=elysia|nest` - Which server to target (default: elysia)
- `--host=127.0.0.1` - Server host (default: 127.0.0.1)
- `--port=7001` - Server port (default: 7001 for elysia, 7002 for nest)
- `--concurrency=100` - Number of concurrent clients (default: 100)
- `--duration=30` - Test duration in seconds (default: 30)
- `--payload=200` - Payload size in bytes (default: 200)

## Output

The benchmark prints JSON with:
- `rps` - Requests per second
- `p50`, `p90`, `p99` - Latency percentiles in milliseconds
- `completed` - Total successful requests
- `errors` - Total failed requests

## Example Results

```json
{
  "target": "elysia",
  "concurrency": 100,
  "rps": 12500.50,
  "p50": 7.250,
  "p90": 12.100,
  "p99": 25.500,
  "completed": 375015,
  "errors": 0
}
```

## Benchmark Summary — 3 Runs

### Raw Results

| Run       | Framework  |         RPS |  p50 (ms) |  p90 (ms) |  p99 (ms) |
| --------- | ---------- | ----------: | --------: | --------: | --------: |
| **Run 1** | Nest       |     145,343 |     0.650 |     0.887 | **1.819** |
|           | **Elysia** | **171,221** | **0.432** | **0.878** |     2.477 |
| **Run 2** | Nest       |     130,527 |     0.675 |     0.990 |     2.373 |
|           | **Elysia** | **245,463** | **0.358** | **0.409** | **1.781** |
| **Run 3** | Nest       |     122,794 |     0.667 |     1.089 |     2.732 |
|           | **Elysia** | **245,086** | **0.360** | **0.412** | **1.779** |

---

## 🏆 Winner per Run

| Run       | Winner     | Reason                                           |
| --------- | ---------- | ------------------------------------------------ |
| **Run 1** | **Elysia** | Higher RPS, lower p50 & p90 (Nest only wins p99) |
| **Run 2** | **Elysia** | ~2× RPS, lower latency at all percentiles        |
| **Run 3** | **Elysia** | ~2× RPS, lower latency at all percentiles        |

---

## 🥇 Overall Winner (Across All 3 Runs)

### **Elysia — clear and consistent winner**

**Why this is conclusive:**

* Wins **all 3 runs**
* Dominates throughput every time
* Lower median, high-percentile, and tail latency in 2 out of 3 runs
* Far better run-to-run consistency
* Nest shows declining throughput and worsening tail latency
