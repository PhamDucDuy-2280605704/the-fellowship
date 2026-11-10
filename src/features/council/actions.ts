"use server";

import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
function validId(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }
function back(slug: string, error?: string): never {
  redirect(error ? `/workspaces/${slug}/council?error=${error}` : `/workspaces/${slug}/council`);
}

export async function createProposal(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const title = field(formData, "title");
  const context = field(formData, "context");
  const closesAtRaw = field(formData, "closesAt");
  const closesAtDate = closesAtRaw ? new Date(closesAtRaw) : null;
  const closesAt = closesAtDate && Number.isFinite(closesAtDate.getTime()) ? closesAtDate.toISOString() : null;
  const votingMode = field(formData, "votingMode") === "anonymous" ? "anonymous" : "open";
  const options = field(formData, "options").split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 8)
    .map((line) => { const [optionTitle, ...rest] = line.split("|"); return { title: optionTitle.trim(), description: rest.join("|").trim().slice(0, 3000) }; });
  const criteria = field(formData, "criteria").split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 8)
    .map((line) => { const [criterionTitle, rawWeight] = line.split("|"); const weight = rawWeight?.trim() ? Number(rawWeight.trim()) : 1; return { title: criterionTitle.trim(), weight }; });
  if (!validId(workspaceId) || title.length < 3 || title.length > 180 || context.length > 8000 ||
      options.length < 2 || options.some((option) => option.title.length < 1 || option.title.length > 180) ||
      criteria.some((criterion) => criterion.title.length < 2 || criterion.title.length > 120 || !Number.isFinite(criterion.weight) || criterion.weight <= 0 || criterion.weight > 100) ||
      (closesAtRaw && (!closesAt || closesAtDate!.getTime() <= Date.now()))) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser();
  const { data: proposal, error } = await supabase.from("council_proposals").insert({
    workspace_id: workspaceId, title, context, status: "draft", created_by: user.id, closes_at: closesAt, voting_mode: votingMode,
  }).select("id").single();
  if (error || !proposal) back(slug, "save");
  const { data: savedOptions, error: optionsError } = await supabase.from("council_options").insert(
    options.map((option) => ({ workspace_id: workspaceId, proposal_id: proposal.id, title: option.title, description: option.description }))
  ).select("id");
  if (optionsError || !savedOptions) back(slug, "options");
  if (criteria.length) {
    const { error: criteriaError } = await supabase.from("council_criteria").insert(
      criteria.map((criterion) => ({ workspace_id: workspaceId, proposal_id: proposal.id, title: criterion.title, weight: criterion.weight, created_by: user.id }))
    );
    if (criteriaError) back(slug, "criteria");
  }
  back(slug);
}

export async function setProposalStatus(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const proposalId = field(formData, "proposalId");
  const status = field(formData, "status");
  if (!validId(workspaceId) || !validId(proposalId) || !["voting", "archived"].includes(status)) back(slug, "invalid");
  const { supabase } = await requireActiveUser();
  const { error } = await supabase.from("council_proposals").update({ status }).eq("id", proposalId).eq("workspace_id", workspaceId);
  back(slug, error ? "status" : undefined);
}

export async function castProposalVote(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const proposalId = field(formData, "proposalId");
  const optionId = field(formData, "optionId");
  if (![workspaceId, proposalId, optionId].every(validId)) back(slug, "invalid");
  const { supabase } = await requireActiveUser();
  const { error } = await supabase.rpc("cast_council_vote", {
    p_workspace_id: workspaceId,
    p_proposal_id: proposalId,
    p_option_id: optionId,
  });
  back(slug, error ? "vote" : undefined);
}

export async function scoreCouncilOption(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const proposalId = field(formData, "proposalId");
  const optionId = field(formData, "optionId");
  const criterionId = field(formData, "criterionId");
  const score = Number(field(formData, "score"));
  const comment = field(formData, "comment");
  if (![workspaceId, proposalId, optionId, criterionId].every(validId) ||
      !Number.isInteger(score) || score < 0 || score > 5 || comment.length > 1000) back(slug, "score");
  const { supabase, user } = await requireActiveUser();
  const { error } = await supabase.from("council_option_scores").upsert({
    workspace_id: workspaceId, proposal_id: proposalId, option_id: optionId,
    criterion_id: criterionId, user_id: user.id, score, comment,
  }, { onConflict: "option_id,criterion_id,user_id" });
  back(slug, error ? "score" : undefined);
}

export async function decideProposal(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const proposalId = field(formData, "proposalId");
  const optionId = field(formData, "optionId");
  const rationale = field(formData, "rationale");
  const followupTitle = field(formData, "followupQuestTitle");
  if (![workspaceId, proposalId, optionId].every(validId) || rationale.length < 1 || rationale.length > 5000 || followupTitle.length > 160) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser();
  const { error: decisionError } = await supabase.from("council_decisions").insert({
    workspace_id: workspaceId, proposal_id: proposalId, chosen_option_id: optionId, rationale, decided_by: user.id,
  });
  if (decisionError) back(slug, "decision");
  const { error: statusError } = await supabase.from("council_proposals").update({ status: "decided" }).eq("id", proposalId).eq("workspace_id", workspaceId);
  if (statusError) back(slug, "status");
  if (followupTitle.length >= 2) {
    const { error: questError } = await supabase.from("quests").insert({
      workspace_id: workspaceId, title: followupTitle, description: `Quest được tạo từ quyết định Council: ${rationale.slice(0, 900)}`,
      status: "backlog", priority: "medium", created_by: user.id,
    });
    if (questError) back(slug, "followup");
  }
  back(slug);
}
