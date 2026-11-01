import React, { useState, useEffect } from "react";
import {
  Code2,
  Users,
  CheckSquare,
  Eye,
  Plus,
  ArrowRight,
  Calendar,
  AlertCircle
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import TrainerBatches from "./TR_Batches";

export function TrainerTasks() {
  // Directly renders TrainerBatches in task-management mode or full workspace
  return <TrainerBatches />;
}

export default TrainerTasks;

