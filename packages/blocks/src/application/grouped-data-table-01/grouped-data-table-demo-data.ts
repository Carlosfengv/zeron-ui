export type GroupedDataTableDemoItem = {
  id: string;
  name: string;
  spec: string;
  provider: "privateCloud" | "aliyun" | "tencentCloud" | "aws";
  workspace: "modelPlatform" | "algorithmTeam" | "searchTeam" | "dataPlatform" | "cloudOps";
  region: "shanghai" | "beijing" | "singapore" | "hongkong";
  capacity: number;
  capacityUnit: "replicas" | "gpus" | "vcpus" | "tb";
  utilization: number;
  status: "running" | "pending" | "scaling" | "maintenance" | "stopped";
  kind: "inference" | "training" | "gpu" | "compute" | "storage";
};

/** Fictional service names and illustrative configurations, capacities and utilization. */
export const groupedDataTableDemoItems: GroupedDataTableDemoItem[] = [
  { id: "infer-atlas-chat", name: "Atlas Chat · 32B", spec: "INT4 · 32K context", provider: "privateCloud", workspace: "modelPlatform", region: "shanghai", capacity: 4, capacityUnit: "replicas", utilization: 72, status: "running", kind: "inference" },
  { id: "infer-orion-reasoning", name: "Orion Reasoning · 70B", spec: "BF16 · 64K context", provider: "aliyun", workspace: "algorithmTeam", region: "beijing", capacity: 8, capacityUnit: "replicas", utilization: 86, status: "scaling", kind: "inference" },
  { id: "infer-atlas-vision", name: "Atlas Vision · 14B", spec: "BF16 · Image + text", provider: "privateCloud", workspace: "modelPlatform", region: "shanghai", capacity: 2, capacityUnit: "replicas", utilization: 0, status: "maintenance", kind: "inference" },
  { id: "infer-vector-embed", name: "Vector Embed · 8B", spec: "FP16 · 4,096 dimensions", provider: "tencentCloud", workspace: "searchTeam", region: "shanghai", capacity: 3, capacityUnit: "replicas", utilization: 45, status: "running", kind: "inference" },
  { id: "infer-vector-rerank", name: "Vector Rerank · 4B", spec: "FP16 · 8K context", provider: "aws", workspace: "searchTeam", region: "singapore", capacity: 2, capacityUnit: "replicas", utilization: 38, status: "running", kind: "inference" },
  { id: "train-atlas-sft", name: "Atlas SFT · v3", spec: "LoRA · 32B · 120K samples", provider: "privateCloud", workspace: "algorithmTeam", region: "shanghai", capacity: 8, capacityUnit: "gpus", utilization: 91, status: "running", kind: "training" },
  { id: "train-orion-alignment", name: "Orion Alignment · v2", spec: "DPO · 70B · 80K pairs", provider: "aliyun", workspace: "algorithmTeam", region: "beijing", capacity: 16, capacityUnit: "gpus", utilization: 84, status: "running", kind: "training" },
  { id: "train-vision-finetune", name: "Vision Fine-tuning · v5", spec: "Full tuning · 14B · 240K samples", provider: "tencentCloud", workspace: "modelPlatform", region: "shanghai", capacity: 4, capacityUnit: "gpus", utilization: 0, status: "pending", kind: "training" },
  { id: "train-embed-distill", name: "Embedding Distillation · v2", spec: "Distillation · 8B → 2B", provider: "aws", workspace: "searchTeam", region: "singapore", capacity: 4, capacityUnit: "gpus", utilization: 0, status: "stopped", kind: "training" },
  { id: "gpu-h100-prod", name: "H100 Inference Pool", spec: "H100 · 80 GB per GPU", provider: "privateCloud", workspace: "cloudOps", region: "shanghai", capacity: 32, capacityUnit: "gpus", utilization: 78, status: "running", kind: "gpu" },
  { id: "gpu-a100-train", name: "A100 Training Pool", spec: "A100 · 80 GB per GPU", provider: "aliyun", workspace: "algorithmTeam", region: "beijing", capacity: 16, capacityUnit: "gpus", utilization: 89, status: "running", kind: "gpu" },
  { id: "gpu-l40s-vision", name: "L40S Vision Pool", spec: "L40S · 48 GB per GPU", provider: "tencentCloud", workspace: "modelPlatform", region: "shanghai", capacity: 8, capacityUnit: "gpus", utilization: 0, status: "maintenance", kind: "gpu" },
  { id: "gpu-h200-elastic", name: "H200 Elastic Pool", spec: "H200 · Elastic capacity", provider: "privateCloud", workspace: "cloudOps", region: "beijing", capacity: 8, capacityUnit: "gpus", utilization: 81, status: "scaling", kind: "gpu" },
  { id: "gpu-a10-dev", name: "A10 Development Pool", spec: "A10 · Development workloads", provider: "aws", workspace: "algorithmTeam", region: "singapore", capacity: 4, capacityUnit: "gpus", utilization: 23, status: "running", kind: "gpu" },
  { id: "vm-api-gateway", name: "Inference API Gateway", spec: "General purpose · 64 GiB RAM", provider: "aliyun", workspace: "modelPlatform", region: "shanghai", capacity: 16, capacityUnit: "vcpus", utilization: 42, status: "running", kind: "compute" },
  { id: "vm-data-pipeline", name: "Dataset Processing Workers", spec: "Compute optimized · 256 GiB RAM", provider: "privateCloud", workspace: "dataPlatform", region: "beijing", capacity: 64, capacityUnit: "vcpus", utilization: 67, status: "running", kind: "compute" },
  { id: "vm-agent-sandbox", name: "Agent Sandbox Cluster", spec: "Isolated workloads · 128 GiB RAM", provider: "tencentCloud", workspace: "cloudOps", region: "hongkong", capacity: 32, capacityUnit: "vcpus", utilization: 0, status: "maintenance", kind: "compute" },
  { id: "store-model-artifacts", name: "Model Artifact Store", spec: "Object storage · Versioning enabled", provider: "aliyun", workspace: "modelPlatform", region: "shanghai", capacity: 120, capacityUnit: "tb", utilization: 62, status: "running", kind: "storage" },
  { id: "store-training-data", name: "Training Dataset Lake", spec: "Distributed files · Training datasets", provider: "privateCloud", workspace: "dataPlatform", region: "beijing", capacity: 256, capacityUnit: "tb", utilization: 74, status: "running", kind: "storage" },
  { id: "store-vector-index", name: "RAG Vector Index", spec: "Vector storage · Retrieval workloads", provider: "aws", workspace: "searchTeam", region: "singapore", capacity: 12, capacityUnit: "tb", utilization: 48, status: "running", kind: "storage" },
];
