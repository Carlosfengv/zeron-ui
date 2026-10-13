import type { ResourceCostItem } from "./resource-cost-types";

export const resourceCostDemoItems: ResourceCostItem[] = [
  { id: "training", name: "LLM Training Cluster", code: "CLU-100", kind: "cluster", quantity: 1, children: [
    { id: "h100-pool", name: "H100 GPU Pool", code: "POOL-110", kind: "pool", quantity: 1, children: [
      { id: "h100-sxm", name: "NVIDIA H100 · 80 GB", code: "GPU-111", kind: "gpu", quantity: 8, unitCost: 12600, availability: "limited", readyInDays: 7 },
      { id: "training-host", name: "Training Host · 128 vCPU", code: "VM-112", kind: "compute", quantity: 2, unitCost: 2800, availability: "reserved", readyInDays: 3 },
    ] },
    { id: "training-storage", name: "NVMe Checkpoint Storage · 4 TB", code: "VOL-113", kind: "storage", quantity: 2, unitCost: 1600, availability: "available", readyInDays: 0 },
    { id: "training-network", name: "InfiniBand Fabric · 400 Gbps", code: "NET-114", kind: "network", quantity: 1, unitCost: 4600, availability: "provisioning", readyInDays: 5 },
  ] },
  { id: "inference", name: "Inference Cluster", code: "CLU-200", kind: "cluster", quantity: 1, children: [
    { id: "l40-pool", name: "L40S GPU Pool", code: "POOL-210", kind: "pool", quantity: 1, children: [
      { id: "l40s", name: "NVIDIA L40S · 48 GB", code: "GPU-211", kind: "gpu", quantity: 4, unitCost: 5200, availability: "available", readyInDays: 0 },
      { id: "inference-host", name: "Inference Host · 64 vCPU", code: "VM-212", kind: "compute", quantity: 2, unitCost: 1800, availability: "available", readyInDays: 0 },
    ] },
    { id: "inference-network", name: "Public Bandwidth · 100 Mbps", code: "NET-220", kind: "network", quantity: 2, unitCost: 900, availability: "available", readyInDays: 0 },
  ] },
  { id: "fine-tuning", name: "Fine-tuning Workspace", code: "CLU-300", kind: "cluster", quantity: 1, children: [
    { id: "a100", name: "NVIDIA A100 · 80 GB", code: "GPU-310", kind: "gpu", quantity: 2, unitCost: 8600, availability: "reserved", readyInDays: 2 },
    { id: "fine-tuning-host", name: "Fine-tuning Host · 32 vCPU", code: "VM-320", kind: "compute", quantity: 1, unitCost: 1200, availability: "available", readyInDays: 0 },
  ] },
  { id: "storage", name: "Shared Data Storage", code: "SYS-400", kind: "storage", quantity: 1, children: [
    { id: "dataset", name: "Dataset Storage · 10 TB", code: "OBJ-410", kind: "storage", quantity: 1, unitCost: 3200, availability: "available", readyInDays: 0 },
    { id: "backup", name: "Snapshot Backup · 5 TB", code: "OBJ-420", kind: "storage", quantity: 1, unitCost: 1400, availability: "available", readyInDays: 0 },
  ] },
  { id: "control", name: "Control Plane", code: "SYS-500", kind: "compute", quantity: 1, children: [
    { id: "control-host", name: "Controller · 8 vCPU", code: "VM-510", kind: "compute", quantity: 3, unitCost: 480, availability: "available", readyInDays: 0 },
  ] },
];
