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
  const options = field(formData, "options").split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 8);
  if (!validId(workspaceId) || title.length < 3 || title.length > 180 ||
      context.length > 8000 || options.length < 2) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser();
  const { data: proposal, error } = await supabase.from("council_proposals").insert({
    workspace_id: workspaceId,
    title,
    context,
    status: "draft",
    created_by: user.id,
  }).select("id").single();
  if (error || !proposal) back(slug, "save");
  const { error: optionsError } = await supabase.from("council_options").insert(
    options.map((option) => ({ workspace_id: workspaceId, proposal_id: proposal.id, title: option }))
  );
  if (optionsError) back(slug, "options");
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
  const { supabase, user } = await requireActiveUser();
  const { error } = await supabase.from("council_votes").upsert({
    workspace_id: workspaceId,
    proposal_id: proposalId,
    option_id: optionId,
    user_id: user.id,
  }, { onConflict: "proposal_id,user_id" });
  back(slug, error ? "vote" : undefined);
}

export async function decideProposal(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const slug = field(formData, "slug");
  const proposalId = field(formData, "proposalId");
  const optionId = field(formData, "optionId");
  const rationale = field(formData, "rationale");
  if (![workspaceId, proposalId, optionId].every(validId) || rationale.length < 1 || rationale.length > 5000) back(slug, "invalid");
  const { supabase, user } = await requireActiveUser();
  const { error: decisionError } = await supabase.from("council_decisions").insert({
    workspace_id: workspaceId,
    proposal_id: proposalId,
    chosen_option_id: optionId,
    rationale,
    decided_by: user.id,
  });
  if (decisionError) back(slug, "decision");
  const { error } = await supabase.from("council_proposals").update({ status: "decided" }).eq("id", proposalId).eq("workspace_id", workspaceId);
  back(slug, error ? "status" : undefined);
}
