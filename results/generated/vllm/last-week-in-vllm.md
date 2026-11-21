# What's New in vLLM Last Week in VLLM (Week Ending 2026-11-19)

## High-Level Explanation
vLLM Last Week in VLLM (Week Ending 2026-11-19) focuses on Multi-Vendor Accelerator Scaling, Frontier MoE & Sparse-MLA Speedups, and Disaggregated Serving. For operators, this release translates 100 upstream engineering changes into lower serving costs, broader hardware/model support, and safer production rollouts.

## 1. What Are the High-Level Changes?
- **Multi-Vendor Accelerator Scaling**: Improves multi-vendor accelerator scaling for cross-vendor llm fleets running deepseek, qwen, llama, and minimax outside cuda-only clouds running on amd instinct mi300x/mi350/mi355x (rocm 10.0), intel xpu, and google cloud tpu, delivering enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code.
- **Frontier MoE & Sparse-MLA Speedups**: Improves frontier moe & sparse-mla speedups for frontier mixture-of-experts (moe) reasoning and agentic models (deepseek-v4/v4.1, glm-5.3, kimi-k3/k3.1, minimax-m3.1) running on nvidia blackwell (gb200/gb300/b200), hopper (h100/h200), and multi-node expert parallel (ep) clusters, delivering delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens.
- **Disaggregated Serving**: Improves disaggregated serving for planet-scale distributed inference clusters, serverless gpu autoscalers, and openai responses api clients running on multi-node rdma / infiniband / aws efa clusters and kubernetes inference gateways, delivering eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore.
- **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend**: Improves day-0 model architectures, multimodal vision/audio & transformers backend for newly released foundation models, vision-language (vlm), speech/asr (`/v1/audio/transcriptions`), and multi-lora adapters running on standard single-node and multi-node gpu inference pools, delivering consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet.
- **Next-Gen Speculative Decoding**: Improves next-gen speculative decoding for interactive coding assistants, agent loops, and low-batch-size real-time inference running on nvidia hopper/blackwell, amd mi300x/mi355x, and cpu/xpu draft runners, delivering accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth.

## 2. Who Benefits? (Models, GPUs & Your Bill)
| Workload / Team | Models / Services | GPUs / Hardware | Practical Impact |
|---|---|---|---|
| **Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU)** | Cross-vendor LLM fleets running DeepSeek, Qwen, Llama, and MiniMax outside CUDA-only clouds | AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU | Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code |
| **Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3)** | Frontier Mixture-of-Experts (MoE) reasoning and agentic models (DeepSeek-V4/V4.1, GLM-5.3, Kimi-K3/K3.1, MiniMax-M3.1) | NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters | Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens |
| **Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore** | Planet-scale distributed inference clusters, serverless GPU autoscalers, and OpenAI Responses API clients | Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways | Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore |
| **Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend** | Newly released foundation models, Vision-Language (VLM), Speech/ASR (`/v1/audio/transcriptions`), and Multi-LoRA adapters | Standard single-node and multi-node GPU inference pools | Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet |
| **Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix)** | Interactive coding assistants, agent loops, and low-batch-size real-time inference | NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners | Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth |
| **Model Enhancements** | General platform workloads and API consumers | Standard cluster nodes and runtime components | Operational reliability and lower maintenance toil |
| **CI Enhancements** | General platform workloads and API consumers | Standard cluster nodes and runtime components | Operational reliability and lower maintenance toil |

## 3. What Does the Jargon Mean?
- **Extensible KV Cache**: Sizes the GPU Key-Value (KV) cache dynamically from actual free VRAM measured *after* model loading and CUDA graph warmup, rather than guessing via a static `gpu_memory_utilization` fraction. Why it matters: Unlocks 20–55% more KV token capacity per GPU (higher concurrency & throughput) without risking startup OOM crashes.
- **Speculative Decoding (EAGLE3 / DSpark / DFlash / MTP / Suffix)**: Uses a fast draft mechanism (a lightweight head like EAGLE3/DSpark, Multi-Token Prediction layers, or n-gram suffix matching) to propose multiple tokens at once, which the main model verifies in a single forward pass. Why it matters: Boosts per-user token generation speed (interactivity/TPOT) by 1.4x–2.5x without changing output quality.
- **MLA & Sparse-MLA (Multi-head Latent Attention)**: An attention architecture (used by DeepSeek-V3/V4, Kimi-K3, GLM-5) that compresses Key-Value states into a compact latent vector, optionally combined with sparse top-k token indexing. Why it matters: Slashes KV cache memory footprint on long contexts (32K–128K+), enabling far larger batch sizes per GPU.
- **NVFP4 / MXFP4 / FP8 Quantization**: 4-bit and 8-bit floating-point weight and activation formats accelerated natively by NVIDIA Blackwell/Hopper and AMD MI350/MI355X Tensor/Matrix cores. Why it matters: Nearly halves GPU memory vs. FP8 (and 4x vs. BF16) while up to doubling GEMM/MoE throughput on Blackwell and MI355X racks.
- **P/D Disaggregation (Prefill/Decode Split & NIXL)**: Separating compute-bound prompt processing (Prefill) onto one pool of GPUs and memory-bandwidth-bound token generation (Decode) onto another, transferring KV cache over RDMA/NVLink via NIXL. Why it matters: Stops long incoming prompts from stalling active streaming users, letting you tune GPU ratios independently for TTFT and TPOT SLAs.
- **DCP & PCP (Decode / Prefill Context Parallelism)**: Sharding the KV cache and attention computation of a single long-context sequence across multiple GPUs during prefill (PCP) or decode (DCP). Why it matters: Prevents single-GPU KV cache bottlenecks and reduces Time-to-First-Token (TTFT) on 32K–1M token agentic prompts.
- **MoE / MegaMoE & Expert Parallelism (EP / DeepGEMM)**: Specialized kernels and all-to-all communication schedules that route tokens across Mixture-of-Experts (MoE) layers distributed across many GPUs. Why it matters: Essential for serving frontier MoE models (DeepSeek-V4, Mistral Large 4, GLM-5.3, Kimi-K3) at high tokens/sec per GPU.
- **Piecewise & Breakable CUDA Graphs**: Capturing sequences of GPU kernel launches into replayable graphs (even across dynamic control flow) so the CPU doesn't launch hundreds of tiny kernels per token. Why it matters: Eliminates CPU bottlenecks during decode, cutting inter-token latency (ITL) by 5–25% without long `torch.compile` warmups.
- **Tiered KV Offloading & Prefix Caching**: Evicting and reusing computed KV cache blocks across GPU HBM, host CPU DRAM, local NVMe, or shared object storage instead of recomputing shared system prompts. Why it matters: Dramatically lowers prefill compute cost and TTFT for multi-turn chat and agent workloads that share long context prefixes.

## 4. Should I Upgrade?
**Verdict**: UPGRADE WITH CONFIG CHECK — High-ROI throughput/stability gains, but review breaking flag/API removals first
- **Before You Upgrade**: Normalize native GTE positional embedding configuration -> Action: Included in weekly merge #69145 (2026-11-21). ([#69145](https://github.com/vllm-project/vllm/pull/69145))
- **Before You Upgrade**: Convert PIL video frames to RGB like PIL images -> Action: Included in weekly merge #69089 (2026-11-21). ([#69089](https://github.com/vllm-project/vllm/pull/69089))
- **Before You Upgrade**: Return 400 for unreadable embedding payloads -> Action: Included in weekly merge #69073 (2026-11-21). ([#69073](https://github.com/vllm-project/vllm/pull/69073))
- **Before You Upgrade**: Avoid MIOpen's split-K conv solver in batch-invariant mode -> Action: Included in weekly merge #69025 (2026-11-20). ([#69025](https://github.com/vllm-project/vllm/pull/69025))
- **Before You Upgrade**: Read the DSpark draft's native mega MoE flag from its layers -> Action: Included in weekly merge #69023 (2026-11-21). ([#69023](https://github.com/vllm-project/vllm/pull/69023))
- **Before You Upgrade**: Reject stop strings when the generate server has no tokenizer -> Action: Included in weekly merge #68989 (2026-11-20). ([#68989](https://github.com/vllm-project/vllm/pull/68989))
- **Before You Upgrade**: Emit the prefill staging plan without a dense prefill backend -> Action: Included in weekly merge #68967 (2026-11-20). ([#68967](https://github.com/vllm-project/vllm/pull/68967))
- **Before You Upgrade**: Read /v1/decisions predicates like /v1/systemone noul questions -> Action: Included in weekly merge #68917 (2026-11-20). ([#68917](https://github.com/vllm-project/vllm/pull/68917))
- **Security**: Stop Responses input validation after the first invalid item (@jperezdealgaba, #68907). ([#68907](https://github.com/vllm-project/vllm/pull/68907))
- **Security**: Bound the number of batch chat conversations (@jperezdealgaba, #68904). ([#68904](https://github.com/vllm-project/vllm/pull/68904))

## 5. Technical Deep Dive (What's the Big Deal Under the Hood?)
### 1. Multi-Vendor Accelerator Scaling (AMD ROCm 10 / MI355X, TPU & XPU) ([#68987](https://github.com/vllm-project/vllm/pull/68987), [#68568](https://github.com/vllm-project/vllm/pull/68568), [#69025](https://github.com/vllm-project/vllm/pull/69025), [#68829](https://github.com/vllm-project/vllm/pull/68829))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating multi-vendor accelerator scaling relied on older execution paths or manual tuning on AMD Instinct MI300X/MI350/MI355X (ROCm 10.0), Intel XPU, and Google Cloud TPU.
- **Technical change**: Revert "[ROCm][CI] Retarget `mi300_dpx` jobs to `mi300_1` queue temporarily" (@sheralskumar, #68987).
- **Technical change**: Retarget `mi300_dpx` jobs to `mi300_1` queue temporarily (@sheralskumar, #68568).
- **Technical change**: Avoid MIOpen's split-K conv solver in batch-invariant mode (@mirza-halilcevic, #69025).
- **Technical change**: Retry ROCm image builds when a package mirror still fails after apt's retries (@AndreasKaratzas, #68829).
- **Operational impact**: Enables hardware price-performance arbitrage across AMD and NVIDIA GPU clouds without changing serving code
### 2. Frontier MoE & Sparse-MLA Speedups (DeepSeek-V4, GLM-5.3, Kimi-K3, MiniMax-M3) ([#68948](https://github.com/vllm-project/vllm/pull/68948), [#68965](https://github.com/vllm-project/vllm/pull/68965), [#68556](https://github.com/vllm-project/vllm/pull/68556), [#68738](https://github.com/vllm-project/vllm/pull/68738))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating frontier moe & sparse-mla speedups relied on older execution paths or manual tuning on NVIDIA Blackwell (GB200/GB300/B200), Hopper (H100/H200), and multi-node Expert Parallel (EP) clusters.
- **Technical change**: Use upstream DeepseekV32Config and fix DeepSeek-V3.2 NVFP4 loading (@hmellor, #68948).
- **Technical change**: Check the MLA W_UV kernel through a Triton launch hook (@bogdan-petkovic, #68965).
- **Technical change**: DeepSeek-V4.1-Flash: GB300 Dynamo AgentX presets from InferenceX #5015 (@Juntian777, #68556).
- **Technical change**: Keep one vision_chunk UUID per item when rebuilding (@sbangalore, #68738).
- **Operational impact**: Delivers 1.24x–1.95x higher throughput and faster long-prompt TTFT, directly slashing cost-per-million tokens
### 3. Disaggregated Serving (P/D, DCP/PCP), Fault Tolerance & Fast Checkpoint/Restore ([#68875](https://github.com/vllm-project/vllm/pull/68875), [#69019](https://github.com/vllm-project/vllm/pull/69019), [#68921](https://github.com/vllm-project/vllm/pull/68921), [#68913](https://github.com/vllm-project/vllm/pull/68913))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating disaggregated serving relied on older execution paths or manual tuning on Multi-node RDMA / InfiniBand / AWS EFA clusters and Kubernetes inference gateways.
- **Technical change**: Register public HY4 checkpoint and update supported models (@jeejeelee, #68875).
- **Technical change**: Support `additional_tools` input items in the Responses API (@albertoperdomo2, #69019).
- **Technical change**: Export ZAYA1 CCA prefill checkpoints (@JaredforReal, #68921).
- **Technical change**: List valid model aliases when a model is not found (@BugenZhao, #68913).
- **Operational impact**: Eliminates full-cluster restarts when a single GPU rank dies and cuts autoscaling cold-start time via CRIU restore
### 4. Day-0 Model Architectures, Multimodal Vision/Audio & Transformers Backend ([#68900](https://github.com/vllm-project/vllm/pull/68900), [#68864](https://github.com/vllm-project/vllm/pull/68864), [#68831](https://github.com/vllm-project/vllm/pull/68831), [#69028](https://github.com/vllm-project/vllm/pull/69028))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating day-0 model architectures, multimodal vision/audio & transformers backend relied on older execution paths or manual tuning on Standard single-node and multi-node GPU inference pools.
- **Technical change**: Deprecate `VLLM_OBJECT_STORAGE_SHM_BUFFER_NAME` env var (@Isotr0py, #68900).
- **Technical change**: Inkling 2 Small: serve from nightly and add Hopper (H200) (@WoosukKwon, #68864).
- **Technical change**: Encoder CUDA graphs for the Qwen3-Omni / Qwen3-ASR audio tower (@deepankerk, #68831).
- **Technical change**: Add Inkling 2 Mini (@WoosukKwon, #69028).
- **Operational impact**: Consolidates text, vision, speech, and embedding models onto a single unified vLLM serving fleet
### 5. Next-Gen Speculative Decoding (EAGLE3, DSpark, DFlash, MTP & Suffix) ([#69065](https://github.com/vllm-project/vllm/pull/69065), [#68986](https://github.com/vllm-project/vllm/pull/68986), [#68701](https://github.com/vllm-project/vllm/pull/68701), [#69023](https://github.com/vllm-project/vllm/pull/69023))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating next-gen speculative decoding relied on older execution paths or manual tuning on NVIDIA Hopper/Blackwell, AMD MI300X/MI355X, and CPU/XPU draft runners.
- **Technical change**: Faster fused CUDA MTP decode for 16-bit recurrent state (@gau-nernst, #69065).
- **Technical change**: Warm the Triton autotune cache in the MTP sharded-sampling test (@stefankoncarevic, #68986).
- **Technical change**: Serve GQA DSpark drafts on the specialized drafter (@mgoin, #68701).
- **Technical change**: Read the DSpark draft's native mega MoE flag from its layers (@roborluo, #69023).
- **Operational impact**: Accelerates single-stream decode speed by 1.35x–2.2x using idle GPU memory bandwidth
### 6. Model Enhancements ([#69013](https://github.com/vllm-project/vllm/pull/69013), [#68976](https://github.com/vllm-project/vllm/pull/68976), [#68793](https://github.com/vllm-project/vllm/pull/68793), [#68702](https://github.com/vllm-project/vllm/pull/68702))
- **Previously**: Prior to Last Week in VLLM (Week Ending 2026-11-19), teams operating model enhancements relied on older execution paths or manual tuning on Standard cluster nodes and runtime components.
- **Technical change**: Hy4-flash Cleanup (@jeejeelee, #69013).
- **Technical change**: Add masked_token_ids to never sample given tokens (@aoshen02, #68976).
- **Technical change**: Use upstream Falcon and RADIO configs at the Transformers 5.16 floor (@hmellor, #68793).
- **Technical change**: Voxtral: drop the unused model field from TranscriptionRequest (@juliendenize, #68702).
- **Operational impact**: Operational reliability and lower maintenance toil

### Weekly / Patch Merge Pulse
- `2026-11-21` [Bugfix] Normalize native GTE positional embedding configuration ([#69145](https://github.com/vllm-project/vllm/pull/69145)) by @hlin99
- `2026-11-21` [CI] Use platform device in M-RoPE prompt embeds test ([#69134](https://github.com/vllm-project/vllm/pull/69134)) by @hlin99
- `2026-11-21` [Doc] Add vLLM security review skill ([#69101](https://github.com/vllm-project/vllm/pull/69101)) by @jperezdealgaba
- `2026-11-21` [Bugfix][Multimodal] Convert PIL video frames to RGB like PIL images ([#69089](https://github.com/vllm-project/vllm/pull/69089)) by @yarikama
- `2026-11-21` [Bugfix][Multimodal] Return 400 for unreadable embedding payloads ([#69073](https://github.com/vllm-project/vllm/pull/69073)) by @my-git9
- `2026-11-21` [Kernel][GDN] Faster fused CUDA MTP decode for 16-bit recurrent state ([#69065](https://github.com/vllm-project/vllm/pull/69065)) by @gau-nernst
- `2026-11-20` [Recipe] Inkling 2 Mini: serve the full 1M context on one GPU ([#69039](https://github.com/vllm-project/vllm/pull/69039)) by @WoosukKwon
- `2026-11-21` [Model] Add Inkling 2 Mini ([#69028](https://github.com/vllm-project/vllm/pull/69028)) by @WoosukKwon

## 6. Where's the Proof?
- **Kernel** ([#69065](https://github.com/vllm-project/vllm/pull/69065)): Faster fused CUDA MTP decode for 16-bit recurrent state.
- **HiSparse** ([#69026](https://github.com/vllm-project/vllm/pull/69026)): Support HY4 Flash.
- **Bugfix** ([#69023](https://github.com/vllm-project/vllm/pull/69023)): Read the DSpark draft's native mega MoE flag from its layers.
- **Model** ([#69013](https://github.com/vllm-project/vllm/pull/69013)): Hy4-flash Cleanup.
- **ROCm** ([#68965](https://github.com/vllm-project/vllm/pull/68965)): Check the MLA W_UV kernel through a Triton launch hook.
- **Perf** ([#68921](https://github.com/vllm-project/vllm/pull/68921)): Export ZAYA1 CCA prefill checkpoints.
- **Perf** ([#68842](https://github.com/vllm-project/vllm/pull/68842)): QSA: sm_100 split-K launch configs for small batches.
- **Perf** ([#68831](https://github.com/vllm-project/vllm/pull/68831)): Encoder CUDA graphs for the Qwen3-Omni / Qwen3-ASR audio tower.
- **Model** ([#68761](https://github.com/vllm-project/vllm/pull/68761)): Inkling 2: Humming expert GEMMs on Hopper.
- **Kimi K3.1** ([#68701](https://github.com/vllm-project/vllm/pull/68701)): Serve GQA DSpark drafts on the specialized drafter.

### Complete Feature Graduation & Enhancement Rollup
- **[Engine & Runtime]** Revert "[ROCm][CI] Retarget `mi300_dpx` jobs to `mi300_1` queue temporarily" (@sheralskumar, #68987). ([#68987](https://github.com/vllm-project/vllm/pull/68987))
- **[Model]** Use upstream DeepseekV32Config and fix DeepSeek-V3.2 NVFP4 loading (@hmellor, #68948). ([#68948](https://github.com/vllm-project/vllm/pull/68948))
- **[Model]** Register public HY4 checkpoint and update supported models (@jeejeelee, #68875). ([#68875](https://github.com/vllm-project/vllm/pull/68875))
- **[ROCm]** Retarget `mi300_dpx` jobs to `mi300_1` queue temporarily (@sheralskumar, #68568). ([#68568](https://github.com/vllm-project/vllm/pull/68568))
- **[Multimodal]** Deprecate `VLLM_OBJECT_STORAGE_SHM_BUFFER_NAME` env var (@Isotr0py, #68900). ([#68900](https://github.com/vllm-project/vllm/pull/68900))
- **[Kernel]** Faster fused CUDA MTP decode for 16-bit recurrent state (@gau-nernst, #69065). ([#69065](https://github.com/vllm-project/vllm/pull/69065))
- **[ROCm]** Avoid MIOpen's split-K conv solver in batch-invariant mode (@mirza-halilcevic, #69025). ([#69025](https://github.com/vllm-project/vllm/pull/69025))
- **[CI]** Warm the Triton autotune cache in the MTP sharded-sampling test (@stefankoncarevic, #68986). ([#68986](https://github.com/vllm-project/vllm/pull/68986))
- **[ROCm]** Check the MLA W_UV kernel through a Triton launch hook (@bogdan-petkovic, #68965). ([#68965](https://github.com/vllm-project/vllm/pull/68965))
- **[Recipe]** Inkling 2 Small: serve from nightly and add Hopper (H200) (@WoosukKwon, #68864). ([#68864](https://github.com/vllm-project/vllm/pull/68864))
- **[CI]** Move B200 DeepEP v2 MoE DP integration to nightly (@Thangnguyenvn98, #68840). ([#68840](https://github.com/vllm-project/vllm/pull/68840))
- **[Perf]** Encoder CUDA graphs for the Qwen3-Omni / Qwen3-ASR audio tower (@deepankerk, #68831). ([#68831](https://github.com/vllm-project/vllm/pull/68831))
- **[ROCm]** Retry ROCm image builds when a package mirror still fails after apt's retries (@AndreasKaratzas, #68829). ([#68829](https://github.com/vllm-project/vllm/pull/68829))
- **[Kimi K3.1]** Serve GQA DSpark drafts on the specialized drafter (@mgoin, #68701). ([#68701](https://github.com/vllm-project/vllm/pull/68701))
- **[ROCm]** Avoid torch 2.13 Inductor gather bug in Nemotron diffusion sampler (@stefankoncarevic, #68694). ([#68694](https://github.com/vllm-project/vllm/pull/68694))
- **[ROCm]** Dump child process stacks before the Model Executor test timeout (@bogdan-petkovic, #68652). ([#68652](https://github.com/vllm-project/vllm/pull/68652))
- **[ROCm]** Export PLE short-conv prefill checkpoints on ROCm (@JaredforReal, #68574). ([#68574](https://github.com/vllm-project/vllm/pull/68574))
- **[ROCm]** Run test_preprocess_error_handling in its own AMD step (@AndreasKaratzas, #68571). ([#68571](https://github.com/vllm-project/vllm/pull/68571))
- **[Recipe]** DeepSeek-V4.1-Flash: GB300 Dynamo AgentX presets from InferenceX #5015 (@Juntian777, #68556). ([#68556](https://github.com/vllm-project/vllm/pull/68556))
- **[Model]** Add Inkling 2 Mini (@WoosukKwon, #69028). ([#69028](https://github.com/vllm-project/vllm/pull/69028))
- **[Model]** Hy4-flash Cleanup (@jeejeelee, #69013). ([#69013](https://github.com/vllm-project/vllm/pull/69013))
- **[Model]** Add masked_token_ids to never sample given tokens (@aoshen02, #68976). ([#68976](https://github.com/vllm-project/vllm/pull/68976))
- **[Model]** Use upstream Transformers configs for Inkling (@hmellor, #68975). ([#68975](https://github.com/vllm-project/vllm/pull/68975))
- **[Model]** Use upstream Falcon and RADIO configs at the Transformers 5.16 floor (@hmellor, #68793). ([#68793](https://github.com/vllm-project/vllm/pull/68793))
- **[Model]** Inkling 2: Humming expert GEMMs on Hopper (@WoosukKwon, #68761). ([#68761](https://github.com/vllm-project/vllm/pull/68761))
- **[Model]** Voxtral: drop the unused model field from TranscriptionRequest (@juliendenize, #68702). ([#68702](https://github.com/vllm-project/vllm/pull/68702))
- **[Model]** Serve native Transformers GTE rerankers and their LoRA adapters (@LantaoJin, #68622). ([#68622](https://github.com/vllm-project/vllm/pull/68622))
- **[Misc]** Remove --disable-cascade-attn past its removal version (@sh4shv4t, #68789). ([#68789](https://github.com/vllm-project/vllm/pull/68789))
- **[Bugfix]** Read the DSpark draft's native mega MoE flag from its layers (@roborluo, #69023). ([#69023](https://github.com/vllm-project/vllm/pull/69023))
- **[Bugfix]** Qwen3-VL: accept integer per-video fps lists (@yarikama, #68832). ([#68832](https://github.com/vllm-project/vllm/pull/68832))
- **[Bugfix]** Fix a cross-wave race in the batched kpool decode update (@djramic, #68749). ([#68749](https://github.com/vllm-project/vllm/pull/68749))
- **[Bugfix]** Keep one vision_chunk UUID per item when rebuilding (@sbangalore, #68738). ([#68738](https://github.com/vllm-project/vllm/pull/68738))
- **[Bugfix]** Cast ViT time_weight to the pos-emb dtype for video chunks (@sbangalore, #68737). ([#68737](https://github.com/vllm-project/vllm/pull/68737))
- **[Bugfix]** Give EngineCore the cleanup grace window when shutdown has no budget (@AndreasKaratzas, #68554). ([#68554](https://github.com/vllm-project/vllm/pull/68554))
- **[Rust Frontend]** Support `additional_tools` input items in the Responses API (@albertoperdomo2, #69019). ([#69019](https://github.com/vllm-project/vllm/pull/69019))
- **[Transformers backend]** Trace decorated forwards and pin `cache` in the fx tracer (@hmellor, #68724). ([#68724](https://github.com/vllm-project/vllm/pull/68724))
- **[CI]** Use platform device in M-RoPE prompt embeds test (@hlin99, #69134). ([#69134](https://github.com/vllm-project/vllm/pull/69134))
- **[Doc]** Add vLLM security review skill (@jperezdealgaba, #69101). ([#69101](https://github.com/vllm-project/vllm/pull/69101))
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
- **[CI]** Skip HYV4Flash in PP equivalence below Hopper (@JaredforReal, #68883). ([#68883](https://github.com/vllm-project/vllm/pull/68883))
- **[CI]** Fix Engram peer group test capability (@hlin99, #68881). ([#68881](https://github.com/vllm-project/vllm/pull/68881))
- **[Recipe]** Add HY4 (@esmeetu, #68844). ([#68844](https://github.com/vllm-project/vllm/pull/68844))
- **[Perf]** QSA: sm_100 split-K launch configs for small batches (@notch776, #68842). ([#68842](https://github.com/vllm-project/vllm/pull/68842))
- **[CI]** Use real hash initialization in KV handshake tests (@hlin99, #68815). ([#68815](https://github.com/vllm-project/vllm/pull/68815))
- **[Spec Decode]** Derive speculator behavior from SpeculatorConfig instead of method checks (@njhill, #68798). ([#68798](https://github.com/vllm-project/vllm/pull/68798))
- **[CI]** Free torch.compile state between tests in compile pass tests (@mirza-halilcevic, #68790). ([#68790](https://github.com/vllm-project/vllm/pull/68790))
- **[HiSparse]** Store one copy of the offloaded indexer across TP ranks (@MatthewBonanni, #68785). ([#68785](https://github.com/vllm-project/vllm/pull/68785))
- **[Bugfix]** Hoist `additional_tools` input items into Responses tools (@albertoperdomo2, #68781). ([#68781](https://github.com/vllm-project/vllm/pull/68781))
- **[Misc]** Trim get_decode_stream_seed docstring (@njhill, #68780). ([#68780](https://github.com/vllm-project/vllm/pull/68780))
- **[Rust Frontend]** Stream Muse tool-call arguments (@jeejeelee, #68766). ([#68766](https://github.com/vllm-project/vllm/pull/68766))
- **[Benchmark]** Add decisions backends to vllm bench serve (@taneem-ibrahim, #68760). ([#68760](https://github.com/vllm-project/vllm/pull/68760))
- **[Bugfix]** Find the compiled module through `*args` in the bytecode hook (@hmellor, #68717). ([#68717](https://github.com/vllm-project/vllm/pull/68717))
- **[Perf]** Export ShortConv (LFM2/LFM3) prefill checkpoints (@JaredforReal, #68673). ([#68673](https://github.com/vllm-project/vllm/pull/68673))
- **[XPU]** Move BMG Engine (1 GPU) on k8s to avoid random hang (@zxd1997066, #68653). ([#68653](https://github.com/vllm-project/vllm/pull/68653))
- **[XPU]** quick fix for _compact_sampling_mask_xpu (@yma11, #68624). ([#68624](https://github.com/vllm-project/vllm/pull/68624))
- **[CI]** Add Hybrid SSM NixlConnector PD prefix cache test to Intel CI (@faaany, #68617). ([#68617](https://github.com/vllm-project/vllm/pull/68617))
- **[Rust Frontend]** Serve /generative_scoring (@BugenZhao, #68612). ([#68612](https://github.com/vllm-project/vllm/pull/68612))
- **[CI]** Skip HYV4 and Inkling in PP equivalence below Hopper (@JaredforReal, #68604). ([#68604](https://github.com/vllm-project/vllm/pull/68604))
- **[CI]** Ignore the key file path when checking that the watermark key is not quoted (@JaredforReal, #68592). ([#68592](https://github.com/vllm-project/vllm/pull/68592))
- **[Build]** Cap nvidia-cudnn-frontend below 1.33 (@Thangnguyenvn98, #68566). ([#68566](https://github.com/vllm-project/vllm/pull/68566))
- **[Rust Frontend]** Report metadata-only input capability in engine handshake (@gty111, #68565). ([#68565](https://github.com/vllm-project/vllm/pull/68565))
- **[Refactor]** Move CUDA graph sizing policy into Platform (@Pb314314, #68552). ([#68552](https://github.com/vllm-project/vllm/pull/68552))
- **[XPU]** Enable sampler-flag and logits-processor tests on XPU (@zhenwei-intel, #68541). ([#68541](https://github.com/vllm-project/vllm/pull/68541))
- **[Bugfix]** Normalize native GTE positional embedding configuration (@hlin99, #69145). ([#69145](https://github.com/vllm-project/vllm/pull/69145))
- **[Bugfix]** Convert PIL video frames to RGB like PIL images (@yarikama, #69089). ([#69089](https://github.com/vllm-project/vllm/pull/69089))
- **[Bugfix]** Return 400 for unreadable embedding payloads (@my-git9, #69073). ([#69073](https://github.com/vllm-project/vllm/pull/69073))
- **[Bugfix]** Reject stop strings when the generate server has no tokenizer (@hickeyma, #68989). ([#68989](https://github.com/vllm-project/vllm/pull/68989))
- **[Bugfix]** Emit the prefill staging plan without a dense prefill backend (@HansG89, #68967). ([#68967](https://github.com/vllm-project/vllm/pull/68967))
- **[Bugfix]** Read /v1/decisions predicates like /v1/systemone noul questions (@simon-veitner-redhat, #68917). ([#68917](https://github.com/vllm-project/vllm/pull/68917))
- **[Bugfix]** Forward --seed to the spec_bench and speed_bench datasets (@johnsonshi, #68859). ([#68859](https://github.com/vllm-project/vllm/pull/68859))
- **[Bugfix]** Normalize negative-stride video inputs (@yarikama, #68857). ([#68857](https://github.com/vllm-project/vllm/pull/68857))
- **[Bugfix]** Let chunked embeddings truncate above max_model_len (@hungnnvidia, #68852). ([#68852](https://github.com/vllm-project/vllm/pull/68852))
- **[Bugfix]** Free consumed encoder inputs at schedule time (simplifies #67385) (@njhill, #68799). ([#68799](https://github.com/vllm-project/vllm/pull/68799))
- **[Bugfix]** Avoid GPU<->CPU sync in FlashInfer XQA ragged draft mask (@csahithi, #68782). ([#68782](https://github.com/vllm-project/vllm/pull/68782))
- **[Bugfix]** Don't pin the grammar bitmask (@lucamotz, #68764). ([#68764](https://github.com/vllm-project/vllm/pull/68764))
- **[Bugfix]** Map only encoded items in multimodal tower/connector LoRA (@chipsncheese-ie, #68754). ([#68754](https://github.com/vllm-project/vllm/pull/68754))
- **[Bugfix]** Size rope_2d DP vision outputs from the spatial grid (@sbangalore, #68739). ([#68739](https://github.com/vllm-project/vllm/pull/68739))
- **[Bugfix]** Skip GPU restores for cancelled KV imports (@zhenwenqi2024, #68729). ([#68729](https://github.com/vllm-project/vllm/pull/68729))
- **[Bugfix]** Release SimpleCPUOffload CPU caches on connector shutdown (@bogdan-petkovic, #68710). ([#68710](https://github.com/vllm-project/vllm/pull/68710))
- **[Bugfix]** Fuse packed qkv that is sliced, not split (@bigPYJ1151, #68698). ([#68698](https://github.com/vllm-project/vllm/pull/68698))
- **[Bugfix]** Fix hy-v4 mxfp4dfly, data-parallel and cudagraph_mm_encoder, reasoning_parser error (@thisjiang, #68689). ([#68689](https://github.com/vllm-project/vllm/pull/68689))
- **[Bugfix]** Skip the engine's LRU multimodal cache under vllm-rs (@lucamotz, #68672). ([#68672](https://github.com/vllm-project/vllm/pull/68672))
- **[Bugfix]** Accept NumPy images in vLLM's own HF processors (@Arsh624, #68655). ([#68655](https://github.com/vllm-project/vllm/pull/68655))
- **[Bugfix]** Honor batch invariance in manual FlashInfer norm fusion (@Wangyuaneee123, #68600). ([#68600](https://github.com/vllm-project/vllm/pull/68600))
- **[Bugfix]** Keep shared KV layers bound when the target is host-resident (@my-git9, #68586). ([#68586](https://github.com/vllm-project/vllm/pull/68586))
- **[Bugfix]** Decode the Mooncake store's lookup_lease stats (@gcanlin, #68584). ([#68584](https://github.com/vllm-project/vllm/pull/68584))
- **[Bugfix]** Make Unlimited-OCR-2 DASH routing batch invariant (@gty111, #68563). ([#68563](https://github.com/vllm-project/vllm/pull/68563))
- **[Bugfix]** Don't size KV cache groups from draft-only sliding-window buckets (@robertgshaw2-redhat, #68533). ([#68533](https://github.com/vllm-project/vllm/pull/68533))

**Key Feature Gates / API Identifiers**: `mi300_dpx`, `mi300_1`, `VLLM_OBJECT_STORAGE_SHM_BUFFER_NAME`, `additional_tools`, `cache`, `*args`