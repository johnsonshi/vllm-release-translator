# What's New in vLLM Last Week in VLLM (Week Ending 2026-11-19)

## High-Level Explanation
vLLM Last Week in VLLM (Week Ending 2026-11-19) focuses on Multi-Vendor Accelerator Scaling, Frontier MoE & Sparse-MLA Speedups, and Next-Gen Speculative Decoding. For operators, this release translates 100 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.

## 1. What Are the High-Level Changes?
- **Multi-Vendor Accelerator Scaling**: Improves multi-vendor accelerator scaling for cross-vendor llm fleets running deepseek, qwen, llama, and minimax outside cuda-only clouds running on amd instinct mi300x/mi350/mi355x (rocm 10.0), intel xpu, and google cloud tpu, delivering enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code.
- **Frontier MoE & Sparse-MLA Speedups**: Improves frontier moe & sparse-mla speedups for frontier mixture-of-experts (moe) reasoning and agentic models (deepseek-v4/v4.1, glm-5.3, kimi-k3/k3.1, minimax-m3.1) running on nvidia blackwell (gb200/gb300/b200), hopper (h100/h200), and multi-node expert parallel (ep) clusters, delivering delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens.
- **Next-Gen Speculative Decoding**: Improves next-gen speculative decoding for interactive coding assistants, agent loops, and low-batch-size real-time inference running on nvidia hopper/blackwell, amd mi300x/mi355x, and cpu/xpu draft runners, delivering accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth.
- **Low-Precision Quantization Kernels**: Improves low-precision quantization kernels for 100b–1t+ parameter models (mistral large 4, deepseek-v4, qwen3.5/3.8) quantized to 4-bit/8-bit running on nvidia blackwell (sm100 nvfp4), hopper (sm90 fp8), and amd mi350/mi355x, delivering halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput.
- **Disaggregated Serving**: Improves disaggregated serving for planet-scale distributed inference clusters, serverless gpu autoscalers, and openai responses api clients running on multi-node rdma / infiniband / aws efa clusters and kubernetes inference gateways, delivering eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore.

## 2. Who Benefits? (Models, GPUs & Your Bill)
| Workload / Team | Models / Services | GPUs / Hardware | Practical Impact |
|---|---|---|---|
| **Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)** | Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds | AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU | Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code |
| **Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)** | Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1) | NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters | Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens |
| **Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)** | Interactive coding assistants, agent loops, and low-batch-size real-time inference | NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners | Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth |
| **Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming)** | 100B–1T+ parameter models (Mistral Large 4, DeepSeek-V4, Qwen3.5/3.8) quantized to 4-bit/8-bit | NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X | Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput |
| **Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore** | Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients | Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways | Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore |
| **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend** | Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters | Standard single-node and multi-node GPU inference pools | Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet |
| **Model Enhancements** | General platform workloads and API consumers | Standard cluster nodes and runtime components | Operational reliability and lower maintenance toil |

## 3. What Does the Jargon Mean?
- **Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)**: Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass. Why it matters: Boosts per-user token generation speed (interactivity/TPOT) by 1.4x–2.5x without changing output quality.
- **MLA & Sparse-MLA (Multi-head Latent Attention)**: An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing. Why it matters: Slashes KV cache memory footprint on long contexts (32K–128K+), enabling far larger batch sizes per GPU.
- **NVFP4 / MXFP4 / FP8 Quantization**: 4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores. Why it matters: Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks.
- **P/D Disaggregation (Prefill/Decode Split & NIXL)**: Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL. Why it matters: Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs.
- **DCP & PCP (Decode / Prefill Context Parallelism)**: Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP). Why it matters: Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K–1M token agentic prompts.
- **MoE / MegaMoE & Expert Parallelism (EP / DeepGEMM)**: Specialized kernels and all-to-all communication schedules that route tokens across Mixture-of-Experts (MoE) layers distributed across many GPUs. Why it matters: Essential for serving frontier MoE models (DeepSeek-V4, Mistral Large 4, GLM-5.3, Kimi-K3) at high tokens/sec per GPU.
- **Piecewise & Breakable CUDA Graphs**: Capturing sequences of GPU kernel launches into replayable graphs (even across dynamic control flow) so the CPU doesn't launch hundreds of tiny kernels per token. Why it matters: Eliminates CPU bottlenecks during decode, cutting inter-token latency (ITL) by 5–25% without long `torch.compile` warmups.
- **TTFT (Time to First Token) & TPOT / ITL (Time Per Output Token)**: The two core LLM latency SLAs: TTFT measures how fast the first response token appears after a prompt; TPOT/ITL measures how fast subsequent tokens stream. Why it matters: Directly determines whether an AI coding agent or voice assistant feels snappy or sluggish to end users.
- **Tiered KV Offloading & Prefix Caching**: Evicting and reusing computed KV cache blocks across GPU HBM, host CPU DRAM, local NVMe, or shared object storage instead of recomputing shared system prompts. Why it matters: Dramatically lowers prefill compute cost and TTFT for multi-turn chat and agent workloads that share long context prefixes.

## 4. Should I Upgrade?
**Verdict**: UPGRADE WITH CONFIG CHECK — High-ROI throughput/stability gains, but review breaking flag/API removals first
- **Before You Upgrade**: Only inject `cohere_format` default chat-template kwarg in Cohere tokenizer mode -> Action: Included in weekly merge #69468 (2026-11-23). ([#69468](https://github.com/vllm-project/vllm/pull/69468))
- **Before You Upgrade**: Keep MXFP8 linear weights in FP8 on SM90 at TP1 -> Action: Included in weekly merge #69446 (2026-11-23). ([#69446](https://github.com/vllm-project/vllm/pull/69446))
- **Before You Upgrade**: Fix race in in-place LSE merge of chunked context -> Action: Included in weekly merge #69433 (2026-11-23). ([#69433](https://github.com/vllm-project/vllm/pull/69433))
- **Before You Upgrade**: Respect root_path in elastic EP scaling middleware -> Action: Included in weekly merge #69285 (2026-11-23). ([#69285](https://github.com/vllm-project/vllm/pull/69285))
- **Before You Upgrade**: Normalize the legacy Qwen3-ASR text config alias -> Action: Included in weekly merge #69226 (2026-11-23). ([#69226](https://github.com/vllm-project/vllm/pull/69226))
- **Before You Upgrade**: Restore HY4 Flash CUDA platform checks -> Action: Included in weekly merge #69193 (2026-11-23). ([#69193](https://github.com/vllm-project/vllm/pull/69193))
- **Before You Upgrade**: Normalize native GTE positional embedding configuration -> Action: Included in weekly merge #69145 (2026-11-21). ([#69145](https://github.com/vllm-project/vllm/pull/69145))
- **Before You Upgrade**: Preserve reused ARC prefixes during running-request eviction -> Action: Included in weekly merge #69110 (2026-11-22). ([#69110](https://github.com/vllm-project/vllm/pull/69110))
- **Deprecation**: Deprecate the TorchAO backend (@devanshi-code18, #69066). ([#69066](https://github.com/vllm-project/vllm/pull/69066))
- **Security**: Stop Responses input validation after the first invalid item (@jperezdealgaba, #68907). ([#68907](https://github.com/vllm-project/vllm/pull/68907))

## 5. Technical Deep Dive (What's the Big Deal Under the Hood?)
### 1. Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU) ([#68987](https://github.com/vllm-project/vllm/pull/68987), [#69085](https://github.com/vllm-project/vllm/pull/69085), [#69025](https://github.com/vllm-project/vllm/pull/69025), [#68829](https://github.com/vllm-project/vllm/pull/68829))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.
- **Technical change**: Revert "[ROCm][CI] Retarget `mi300_dpx` jobs to `mi300_1` queue temporarily" (@sheralskumar, #68987).
- **Technical change**: Fix precision loss in asymmetric int8 linear layers on ROCm (@rasmith, #69085).
- **Technical change**: Avoid MIOpen's split-K conv solver in batch-invariant mode (@mirza-halilcevic, #69025).
- **Technical change**: Retry ROCm image builds when a package mirror still fails after apt's retries (@AndreasKaratzas, #68829).
- **Operational impact**: Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code
### 2. Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3) ([#68948](https://github.com/vllm-project/vllm/pull/68948), [#69001](https://github.com/vllm-project/vllm/pull/69001), [#69264](https://github.com/vllm-project/vllm/pull/69264), [#68965](https://github.com/vllm-project/vllm/pull/68965))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.
- **Technical change**: Use upstream DeepseekV32Config and fix DeepSeek-V3.2 NVFP4 loading (@hmellor, #68948).
- **Technical change**: Enable fused all-reduce + mHC + RMSNorm on Hopper, 8.7%E2E Throughput Improvement (@yewentao256, #69001).
- **Technical change**: Kimi-K3.1-Pro: B300 PD preset on kimi-k31-mc-f4c9618, align with InferenceX#5175 (@mispa-ms, #69264).
- **Technical change**: Check the MLA W_UV kernel through a Triton launch hook (@bogdan-petkovic, #68965).
- **Operational impact**: Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens
### 3. Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix) ([#69163](https://github.com/vllm-project/vllm/pull/69163), [#69182](https://github.com/vllm-project/vllm/pull/69182), [#69065](https://github.com/vllm-project/vllm/pull/69065), [#68986](https://github.com/vllm-project/vllm/pull/68986))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.
- **Technical change**: Kimi-K3.1-Pro: MI355X kimi-k31-712d9eb image and released DSpark draft, align with InferenceX#5119 (@seungrokj, #69163).
- **Technical change**: Kimi-K3.1-Pro: move the GB300 AgentX presets to the released DSpark draft, align with InferenceX#5109 (@mispa-ms, #69182).
- **Technical change**: Faster fused CUDA MTP decode for 16-bit recurrent state (@gau-nernst, #69065).
- **Technical change**: Warm the Triton autotune cache in the MTP sharded-sampling test (@stefankoncarevic, #68986).
- **Operational impact**: Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth
### 4. Low-Precision Quantization Kernels (NVFP4, MXFP4, MXFP8, FP8 & Humming) ([#69066](https://github.com/vllm-project/vllm/pull/69066), [#69274](https://github.com/vllm-project/vllm/pull/69274), [#69446](https://github.com/vllm-project/vllm/pull/69446), [#68858](https://github.com/vllm-project/vllm/pull/68858))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating low-precision quantization kernels relied on older execution paths or manual tuning on NVIDIA Blackwell (SM100 NVFP4), Hopper (SM90 FP8), and AMD MI350/MI355X.
- **Technical change**: Deprecate the TorchAO backend (@devanshi-code18, #69066).
- **Technical change**: Allow DFly on any compressed-tensors target scheme (NVFP4) (@mgoin, #69274).
- **Technical change**: Keep MXFP8 linear weights in FP8 on SM90 at TP1 (@Ganto12, #69446).
- **Technical change**: add modelopt_mxfp8 quantization format (@yma11, #68858).
- **Operational impact**: Halves GPU count required to fit 400B–1T weights in VRAM and up to doubles Tensor Core compute throughput
### 5. Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore ([#68875](https://github.com/vllm-project/vllm/pull/68875), [#69019](https://github.com/vllm-project/vllm/pull/69019), [#69468](https://github.com/vllm-project/vllm/pull/69468), [#69412](https://github.com/vllm-project/vllm/pull/69412))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.
- **Technical change**: Register public HY4 checkpoint and update supported models (@jeejeelee, #68875).
- **Technical change**: Support `additional_tools` input items in the Responses API (@albertoperdomo2, #69019).
- **Technical change**: Only inject `cohere_format` default chat-template kwarg in Cohere tokenizer mode (@NickLucche, #69468).
- **Technical change**: Expose CuMemBackend allocator hook (@Ronald1995, #69412).
- **Operational impact**: Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore
### 6. Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend ([#68900](https://github.com/vllm-project/vllm/pull/68900), [#68864](https://github.com/vllm-project/vllm/pull/68864), [#68831](https://github.com/vllm-project/vllm/pull/68831), [#69087](https://github.com/vllm-project/vllm/pull/69087))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.
- **Technical change**: Deprecate `VLLM_OBJECT_STORAGE_SHM_BUFFER_NAME` env var (@Isotr0py, #68900).
- **Technical change**: Inkling 2 Small: serve from nightly and add Hopper (H200) (@WoosukKwon, #68864).
- **Technical change**: Encoder CUDA graphs for the Qwen3-Omni / Qwen3-ASR audio tower (@deepankerk, #68831).
- **Technical change**: Migrate ERNIE 4.5 to Transformers backend (@Remarkable911, #69087).
- **Operational impact**: Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet

### Weekly / Patch Merge Pulse
- `2026-11-23` [Docs] Fix HY4 Flash IndexPool API reference warnings ([#69472](https://github.com/vllm-project/vllm/pull/69472)) by @taneem-ibrahim
- `2026-11-23` [Bugfix] Only inject `cohere_format` default chat-template kwarg in Cohere tokenizer mode ([#69468](https://github.com/vllm-project/vllm/pull/69468)) by @NickLucche
- `2026-11-23` [Bugfix][DSv4.1] Keep MXFP8 linear weights in FP8 on SM90 at TP1 ([#69446](https://github.com/vllm-project/vllm/pull/69446)) by @Ganto12
- `2026-11-23` [Governance] Add Taneem Ibrahim as a pooling committer ([#69437](https://github.com/vllm-project/vllm/pull/69437)) by @taneem-ibrahim
- `2026-11-23` [Bugfix][MLA] Fix race in in-place LSE merge of chunked context ([#69433](https://github.com/vllm-project/vllm/pull/69433)) by @stefankoncarevic
- `2026-11-23` [CI] Retry gcc-15 downloads from the Launchpad PPA in the CPU image ([#69416](https://github.com/vllm-project/vllm/pull/69416)) by @khluu
- `2026-11-23` [Refactor][SleepMode] Expose CuMemBackend allocator hook ([#69412](https://github.com/vllm-project/vllm/pull/69412)) by @Ronald1995
- `2026-11-23` [Governance] Update codeowner for wangxiyuan ([#69397](https://github.com/vllm-project/vllm/pull/69397)) by @wangxiyuan

## 6. Where's the Proof?
- **Docs** ([#69472](https://github.com/vllm-project/vllm/pull/69472)): Fix HY4 Flash IndexPool API reference warnings.
- **Bugfix** ([#69433](https://github.com/vllm-project/vllm/pull/69433)): Fix race in in-place LSE merge of chunked context.
- **Bugfix** ([#69193](https://github.com/vllm-project/vllm/pull/69193)): Restore HY4 Flash CUDA platform checks.
- **Recipe** ([#69182](https://github.com/vllm-project/vllm/pull/69182)): Kimi-K3.1-Pro: move the GB300 AgentX presets to the released DSpark draft, align with InferenceX#5109.
- **Perf** ([#69168](https://github.com/vllm-project/vllm/pull/69168)): Improve small M GEMM on 5090 (sm120).
- **Recipe** ([#69163](https://github.com/vllm-project/vllm/pull/69163)): Kimi-K3.1-Pro: MI355X kimi-k31-712d9eb image and released DSpark draft, align with InferenceX#5119.
- **Bugfix** ([#69108](https://github.com/vllm-project/vllm/pull/69108)): Fix ROCm OCR preemption logit drift with DeepEncoder GEMM.
- **Kernel** ([#69065](https://github.com/vllm-project/vllm/pull/69065)): Faster fused CUDA MTP decode for 16-bit recurrent state.
- **Perf** ([#69029](https://github.com/vllm-project/vllm/pull/69029)): Coalesce K_Buffer loads and co-schedule head blocks TRITON_MLA (upto 1.7x gain at kernel level).
- **HiSparse** ([#69026](https://github.com/vllm-project/vllm/pull/69026)): Support HY4 Flash.
- **Recipe** ([#69163](https://github.com/vllm-project/vllm/pull/69163)): Kimi-K3.1-Pro: MI355X kimi-k31-712d9eb image and released DSpark draft, align with InferenceX#5119 (@seungrokj, #69163).
- **Perf** ([#69001](https://github.com/vllm-project/vllm/pull/69001)): Enable fused all-reduce + mHC + RMSNorm on Hopper, 8.7%E2E Throughput Improvement (@yewentao256, #69001).
- **Perf** ([#69029](https://github.com/vllm-project/vllm/pull/69029)): Coalesce K_Buffer loads and co-schedule head blocks TRITON_MLA (upto 1.7x gain at kernel level) (@rwtarpit, #69029).
- **Perf** ([#69021](https://github.com/vllm-project/vllm/pull/69021)): Inkling 2: keep the TMA k_group_partials path on SM12x (@hclsys, #69021).

### Complete Feature Graduation & Enhancement Rollup
- **[Engine & Runtime]** Revert "[ROCm][CI] Retarget `mi300_dpx` jobs to `mi300_1` queue temporarily" (@sheralskumar, #68987). ([#68987](https://github.com/vllm-project/vllm/pull/68987))
- **[Deprecation]** Deprecate the TorchAO backend (@devanshi-code18, #69066). ([#69066](https://github.com/vllm-project/vllm/pull/69066))
- **[Model]** Use upstream DeepseekV32Config and fix DeepSeek-V3.2 NVFP4 loading (@hmellor, #68948). ([#68948](https://github.com/vllm-project/vllm/pull/68948))
- **[Model]** Register public HY4 checkpoint and update supported models (@jeejeelee, #68875). ([#68875](https://github.com/vllm-project/vllm/pull/68875))
- **[Recipe]** Kimi-K3.1-Pro: MI355X kimi-k31-712d9eb image and released DSpark draft, align with InferenceX#5119 (@seungrokj, #69163). ([#69163](https://github.com/vllm-project/vllm/pull/69163))
- **[Perf]** Enable fused all-reduce + mHC + RMSNorm on Hopper, 8.7%E2E Throughput Improvement (@yewentao256, #69001). ([#69001](https://github.com/vllm-project/vllm/pull/69001))
- **[Multimodal]** Deprecate `VLLM_OBJECT_STORAGE_SHM_BUFFER_NAME` env var (@Isotr0py, #68900). ([#68900](https://github.com/vllm-project/vllm/pull/68900))
- **[Spec Decode]** Allow DFly on any compressed-tensors target scheme (NVFP4) (@mgoin, #69274). ([#69274](https://github.com/vllm-project/vllm/pull/69274))
- **[Recipe]** Kimi-K3.1-Pro: B300 PD preset on kimi-k31-mc-f4c9618, align with InferenceX#5175 (@mispa-ms, #69264). ([#69264](https://github.com/vllm-project/vllm/pull/69264))
- **[Recipe]** Kimi-K3.1-Pro: move the GB300 AgentX presets to the released DSpark draft, align with InferenceX#5109 (@mispa-ms, #69182). ([#69182](https://github.com/vllm-project/vllm/pull/69182))
- **[ROCm]** Fix precision loss in asymmetric int8 linear layers on ROCm (@rasmith, #69085). ([#69085](https://github.com/vllm-project/vllm/pull/69085))
- **[Kernel]** Faster fused CUDA MTP decode for 16-bit recurrent state (@gau-nernst, #69065). ([#69065](https://github.com/vllm-project/vllm/pull/69065))
- **[ROCm]** Avoid MIOpen's split-K conv solver in batch-invariant mode (@mirza-halilcevic, #69025). ([#69025](https://github.com/vllm-project/vllm/pull/69025))
- **[CI]** Warm the Triton autotune cache in the MTP sharded-sampling test (@stefankoncarevic, #68986). ([#68986](https://github.com/vllm-project/vllm/pull/68986))
- **[ROCm]** Check the MLA W_UV kernel through a Triton launch hook (@bogdan-petkovic, #68965). ([#68965](https://github.com/vllm-project/vllm/pull/68965))
- **[Recipe]** Inkling 2 Small: serve from nightly and add Hopper (H200) (@WoosukKwon, #68864). ([#68864](https://github.com/vllm-project/vllm/pull/68864))
- **[CI]** Move B200 DeepEP v2 MoE DP integration to nightly (@Thangnguyenvn98, #68840). ([#68840](https://github.com/vllm-project/vllm/pull/68840))
- **[Perf]** Encoder CUDA graphs for the Qwen3-Omni / Qwen3-ASR audio tower (@deepankerk, #68831). ([#68831](https://github.com/vllm-project/vllm/pull/68831))
- **[ROCm]** Retry ROCm image builds when a package mirror still fails after apt's retries (@AndreasKaratzas, #68829). ([#68829](https://github.com/vllm-project/vllm/pull/68829))
- **[Spec Decode]** Support anchor-first (sample_from_anchor) DFlash/DFlash2 drafts (@deepankerk, #68827). ([#68827](https://github.com/vllm-project/vllm/pull/68827))
- **[Model]** Migrate ERNIE 4.5 to Transformers backend (@Remarkable911, #69087). ([#69087](https://github.com/vllm-project/vllm/pull/69087))
- **[Model]** Add Inkling 2 Mini (@WoosukKwon, #69028). ([#69028](https://github.com/vllm-project/vllm/pull/69028))
- **[Model]** Hy4-flash Cleanup (@jeejeelee, #69013). ([#69013](https://github.com/vllm-project/vllm/pull/69013))
- **[Model]** Add masked_token_ids to never sample given tokens (@aoshen02, #68976). ([#68976](https://github.com/vllm-project/vllm/pull/68976))
- **[Model]** Use upstream Transformers configs for Inkling (@hmellor, #68975). ([#68975](https://github.com/vllm-project/vllm/pull/68975))
- **[Model]** Use upstream Falcon and RADIO configs at the Transformers 5.16 floor (@hmellor, #68793). ([#68793](https://github.com/vllm-project/vllm/pull/68793))
- **[Perf]** Coalesce K_Buffer loads and co-schedule head blocks TRITON_MLA (upto 1.7x gain at kernel level) (@rwtarpit, #69029). ([#69029](https://github.com/vllm-project/vllm/pull/69029))
- **[Perf]** Inkling 2: keep the TMA k_group_partials path on SM12x (@hclsys, #69021). ([#69021](https://github.com/vllm-project/vllm/pull/69021))
- **[Misc]** Remove --disable-cascade-attn past its removal version (@sh4shv4t, #68789). ([#68789](https://github.com/vllm-project/vllm/pull/68789))
- **[Bugfix]** Keep MXFP8 linear weights in FP8 on SM90 at TP1 (@Ganto12, #69446). ([#69446](https://github.com/vllm-project/vllm/pull/69446))
- **[Bugfix]** Normalize the legacy Qwen3-ASR text config alias (@pk954061458, #69226). ([#69226](https://github.com/vllm-project/vllm/pull/69226))
- **[Bugfix]** Fix ROCm OCR preemption logit drift with DeepEncoder GEMM (@gty111, #69108). ([#69108](https://github.com/vllm-project/vllm/pull/69108))
- **[Bugfix]** Read the DSpark draft's native mega MoE flag from its layers (@roborluo, #69023). ([#69023](https://github.com/vllm-project/vllm/pull/69023))
- **[Bugfix]** Qwen3-VL: accept integer per-video fps lists (@yarikama, #68832). ([#68832](https://github.com/vllm-project/vllm/pull/68832))
- **[Rust Frontend]** Support `additional_tools` input items in the Responses API (@albertoperdomo2, #69019). ([#69019](https://github.com/vllm-project/vllm/pull/69019))
- **[Docs]** Fix HY4 Flash IndexPool API reference warnings (@taneem-ibrahim, #69472). ([#69472](https://github.com/vllm-project/vllm/pull/69472))
- **[Bugfix]** Only inject `cohere_format` default chat-template kwarg in Cohere tokenizer mode (@NickLucche, #69468). ([#69468](https://github.com/vllm-project/vllm/pull/69468))
- **[Governance]** Add Taneem Ibrahim as a pooling committer (@taneem-ibrahim, #69437). ([#69437](https://github.com/vllm-project/vllm/pull/69437))
- **[CI]** Retry gcc-15 downloads from the Launchpad PPA in the CPU image (@khluu, #69416). ([#69416](https://github.com/vllm-project/vllm/pull/69416))
- **[Refactor]** Expose CuMemBackend allocator hook (@Ronald1995, #69412). ([#69412](https://github.com/vllm-project/vllm/pull/69412))
- **[Governance]** Update codeowner for wangxiyuan (@wangxiyuan, #69397). ([#69397](https://github.com/vllm-project/vllm/pull/69397))
- **[Governance]** Add Tianyu Guo as an EPD code owner (@gty111, #69376). ([#69376](https://github.com/vllm-project/vllm/pull/69376))
- **[Doc]** Highlight HTTP-only (no vLLM import) weight updates in training docs (@aoshen02, #69333). ([#69333](https://github.com/vllm-project/vllm/pull/69333))
- **[Doc]** Fix relative example links in docs/training/weight_updates/engines (@aoshen02, #69300). ([#69300](https://github.com/vllm-project/vllm/pull/69300))
- **[Recipe]** Inkling 2 Mini: use the nightly image (@WoosukKwon, #69296). ([#69296](https://github.com/vllm-project/vllm/pull/69296))
- **[Doc]** Reorganize docs/training/ into weight_updates and rollout_artifacts (@aoshen02, #69248). ([#69248](https://github.com/vllm-project/vllm/pull/69248))
- **[LoRA]** Add private worker-local tensor adapter loading (@jeejeelee, #69229). ([#69229](https://github.com/vllm-project/vllm/pull/69229))
- **[Perf]** Improve small M GEMM on 5090 (sm120) (@gau-nernst, #69168). ([#69168](https://github.com/vllm-project/vllm/pull/69168))
- **[CI]** Allow Gemma3n GPU sync on older Transformers (@hlin99, #69140). ([#69140](https://github.com/vllm-project/vllm/pull/69140))
- **[CI]** Use platform device in M-RoPE prompt embeds test (@hlin99, #69134). ([#69134](https://github.com/vllm-project/vllm/pull/69134))
- **[Doc]** Add vLLM security review skill (@jperezdealgaba, #69101). ([#69101](https://github.com/vllm-project/vllm/pull/69101))
- **[Benchmark]** Time real server starts in vllm bench startup (--serve-cmd) (@matteso1, #69076). ([#69076](https://github.com/vllm-project/vllm/pull/69076))
- **[Recipe]** Inkling 2 Mini: serve the full 1M context on one GPU (@WoosukKwon, #69039). ([#69039](https://github.com/vllm-project/vllm/pull/69039))
- **[Recipe]** Add Inkling 2 Mini (@WoosukKwon, #69027). ([#69027](https://github.com/vllm-project/vllm/pull/69027))
- **[HiSparse]** Support HY4 Flash (@MatthewBonanni, #69026). ([#69026](https://github.com/vllm-project/vllm/pull/69026))
- **[Build]** Relax PyNvVideoCodec pin to >=2.2.4 to resolve CVEs (@brandonpelfrey, #68991). ([#68991](https://github.com/vllm-project/vllm/pull/68991))
- **[Docs]** Add stecasta to reviewers (@stecasta, #68981). ([#68981](https://github.com/vllm-project/vllm/pull/68981))
- **[XPU]** skip not applied tests in lora/test_layer.py and test_config.py on XPU (@yma11, #68971). ([#68971](https://github.com/vllm-project/vllm/pull/68971))
- **[Perf]** Export ZAYA1 CCA prefill checkpoints (@JaredforReal, #68921). ([#68921](https://github.com/vllm-project/vllm/pull/68921))
- **[Rust Frontend]** List valid model aliases when a model is not found (@BugenZhao, #68913). ([#68913](https://github.com/vllm-project/vllm/pull/68913))
- **[Rust Frontend]** Prefer tokenizer.json over tekken.json (@BugenZhao, #68911). ([#68911](https://github.com/vllm-project/vllm/pull/68911))
- **[Rust Frontend]** Unload a LoRA adapter an engine already evicted (@BugenZhao, #68910). ([#68910](https://github.com/vllm-project/vllm/pull/68910))
- **[Security]** Stop Responses input validation after the first invalid item (@jperezdealgaba, #68907). ([#68907](https://github.com/vllm-project/vllm/pull/68907))
- **[Security]** Bound the number of batch chat conversations (@jperezdealgaba, #68904). ([#68904](https://github.com/vllm-project/vllm/pull/68904))
- **[CI]** Use a uv-managed Python in the Python 3.12 smoke test (@csahithi, #68887). ([#68887](https://github.com/vllm-project/vllm/pull/68887))
- **[CI]** Use test runner for sampling and LoRA tests (@hlin99, #68884). ([#68884](https://github.com/vllm-project/vllm/pull/68884))
- **[CI]** Skip HYV4Flash in PP equivalence below Hopper (@JaredforReal, #68883). ([#68883](https://github.com/vllm-project/vllm/pull/68883))
- **[CI]** Fix Engram peer group test capability (@hlin99, #68881). ([#68881](https://github.com/vllm-project/vllm/pull/68881))
- **[CI]** Decouple LoRA layer tests from GLM model imports (@hlin99, #68867). ([#68867](https://github.com/vllm-project/vllm/pull/68867))
- **[XPU]** add modelopt_mxfp8 quantization format (@yma11, #68858). ([#68858](https://github.com/vllm-project/vllm/pull/68858))
- **[Recipe]** Add HY4 (@esmeetu, #68844). ([#68844](https://github.com/vllm-project/vllm/pull/68844))
- **[Perf]** QSA: sm_100 split-K launch configs for small batches (@notch776, #68842). ([#68842](https://github.com/vllm-project/vllm/pull/68842))
- **[CI]** Use real hash initialization in KV handshake tests (@hlin99, #68815). ([#68815](https://github.com/vllm-project/vllm/pull/68815))
- **[Spec Decode]** Derive speculator behavior from SpeculatorConfig instead of method checks (@njhill, #68798). ([#68798](https://github.com/vllm-project/vllm/pull/68798))
- **[CI]** Free torch.compile state between tests in compile pass tests (@mirza-halilcevic, #68790). ([#68790](https://github.com/vllm-project/vllm/pull/68790))
- **[HiSparse]** Store one copy of the offloaded indexer across TP ranks (@MatthewBonanni, #68785). ([#68785](https://github.com/vllm-project/vllm/pull/68785))
- **[Bugfix]** Hoist `additional_tools` input items into Responses tools (@albertoperdomo2, #68781). ([#68781](https://github.com/vllm-project/vllm/pull/68781))
- **[Misc]** Trim get_decode_stream_seed docstring (@njhill, #68780). ([#68780](https://github.com/vllm-project/vllm/pull/68780))
- **[Bugfix]** Fix race in in-place LSE merge of chunked context (@stefankoncarevic, #69433). ([#69433](https://github.com/vllm-project/vllm/pull/69433))
- **[Bugfix]** Respect root_path in elastic EP scaling middleware (@rishabhsai, #69285). ([#69285](https://github.com/vllm-project/vllm/pull/69285))
- **[Bugfix]** Restore HY4 Flash CUDA platform checks (@hlin99, #69193). ([#69193](https://github.com/vllm-project/vllm/pull/69193))
- **[Bugfix]** Normalize native GTE positional embedding configuration (@hlin99, #69145). ([#69145](https://github.com/vllm-project/vllm/pull/69145))
- **[Bugfix]** Preserve reused ARC prefixes during running-request eviction (@waizuichougou, #69110). ([#69110](https://github.com/vllm-project/vllm/pull/69110))
- **[Bugfix]** Accept NumPy images and PIL frame videos in Muse Spark Open (@yarikama, #69099). ([#69099](https://github.com/vllm-project/vllm/pull/69099))
- **[Bugfix]** Convert PIL video frames to RGB like PIL images (@yarikama, #69089). ([#69089](https://github.com/vllm-project/vllm/pull/69089))
- **[Bugfix]** Return 400 for unreadable embedding payloads (@my-git9, #69073). ([#69073](https://github.com/vllm-project/vllm/pull/69073))
- **[Bugfix]** Accept torch.Tensor videos in vLLM's own HF processors (@yarikama, #69052). ([#69052](https://github.com/vllm-project/vllm/pull/69052))
- **[Bugfix]** Store the chunk containing a partial-tail CPU hit (@nvisional, #69048). ([#69048](https://github.com/vllm-project/vllm/pull/69048))
- **[Bugfix]** torchao: apply each fused shard's AWQ act_pre_scale (@devanshi-code18, #69002). ([#69002](https://github.com/vllm-project/vllm/pull/69002))
- **[Bugfix]** Reject stop strings when the generate server has no tokenizer (@hickeyma, #68989). ([#68989](https://github.com/vllm-project/vllm/pull/68989))
- **[Bugfix]** Emit the prefill staging plan without a dense prefill backend (@HansG89, #68967). ([#68967](https://github.com/vllm-project/vllm/pull/68967))
- **[Bugfix]** Fix oversized piecewise CUDA graphs for Gemma3n cross-decoder (@searlion, #68944). ([#68944](https://github.com/vllm-project/vllm/pull/68944))
- **[Bugfix]** call sys._current_frames() to dump callstack (@wenjinhust, #68924). ([#68924](https://github.com/vllm-project/vllm/pull/68924))
- **[Bugfix]** Read /v1/decisions predicates like /v1/systemone noul questions (@simon-veitner-redhat, #68917). ([#68917](https://github.com/vllm-project/vllm/pull/68917))
- **[Bugfix]** Forward --seed to the spec_bench and speed_bench datasets (@johnsonshi, #68859). ([#68859](https://github.com/vllm-project/vllm/pull/68859))
- **[Bugfix]** Normalize negative-stride video inputs (@yarikama, #68857). ([#68857](https://github.com/vllm-project/vllm/pull/68857))
- **[Bugfix]** Let chunked embeddings truncate above max_model_len (@hungnnvidia, #68852). ([#68852](https://github.com/vllm-project/vllm/pull/68852))
- **[Bugfix]** Apply the video processor frame caps when loading videos (@paulpak58, #68802). ([#68802](https://github.com/vllm-project/vllm/pull/68802))
- **[Bugfix]** Free consumed encoder inputs at schedule time (simplifies #67385) (@njhill, #68799). ([#68799](https://github.com/vllm-project/vllm/pull/68799))
- **[Bugfix]** Avoid GPU<->CPU sync in FlashInfer XQA ragged draft mask (@csahithi, #68782). ([#68782](https://github.com/vllm-project/vllm/pull/68782))

**Key Feature Gates / API Identifiers**: `mi300_dpx`, `mi300_1`, `VLLM_OBJECT_STORAGE_SHM_BUFFER_NAME`, `additional_tools`, `cohere_format`