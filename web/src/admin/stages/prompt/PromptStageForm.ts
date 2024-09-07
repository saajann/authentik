import { BaseStageForm } from "@goauthentik/admin/stages/BaseStageForm";
import "@goauthentik/admin/stages/prompt/PromptForm";
import { DEFAULT_CONFIG } from "@goauthentik/common/api/config";
import { PFSize } from "@goauthentik/common/enums";
import "@goauthentik/elements/ak-dual-select/ak-dual-select-dynamic-selected-provider.js";
import { DualSelectPair } from "@goauthentik/elements/ak-dual-select/types.js";
import "@goauthentik/elements/forms/FormGroup";
import "@goauthentik/elements/forms/HorizontalFormElement";
import "@goauthentik/elements/forms/ModalForm";

import { msg, str } from "@lit/localize";
import { TemplateResult, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { PoliciesApi, Policy, Prompt, PromptStage, StagesApi } from "@goauthentik/api";

async function promptFieldsProvider(page = 1, search = "") {
    const prompts = await new StagesApi(DEFAULT_CONFIG).stagesPromptPromptsList({
        ordering: "field_name",
        pageSize: 20,
        search: search.trim(),
        page,
    });

    return {
        pagination: prompts.pagination,
        options: prompts.results.map((prompt) => [
            prompt.pk,
            msg(str`${prompt.name} ("${prompt.fieldKey}", of type ${prompt.type})`),
        ]),
    };
}

function makeFieldSelector(instanceFields: string[] | undefined) {
    const localFields = instanceFields ? new Set(instanceFields) : undefined;

    return localFields
        ? ([pk, _]: DualSelectPair) => localFields.has(pk)
        : ([_0, _1, _2, prompt]: DualSelectPair<Prompt>) => prompt !== undefined;
}

async function policiesProvider(page = 1, search = "") {
    const policies = await new PoliciesApi(DEFAULT_CONFIG).policiesAllList({
        ordering: "name",
        pageSize: 20,
        search: search.trim(),
        page,
    });

    return {
        pagination: policies.pagination,
        options: policies.results.map((policy) => [
            policy.pk,
            `${policy.name} (${policy.verboseName})`,
        ]),
    };
}

function makePoliciesSelector(instancePolicies: string[] | undefined) {
    const localPolicies = instancePolicies ? new Set(instancePolicies) : undefined;

    return localPolicies
        ? ([pk, _]: DualSelectPair) => localPolicies.has(pk)
        : ([_0, _1, _2, policy]: DualSelectPair<Policy>) => policy !== undefined;
}

@customElement("ak-stage-prompt-form")
export class PromptStageForm extends BaseStageForm<PromptStage> {
    loadInstance(pk: string): Promise<PromptStage> {
        return new StagesApi(DEFAULT_CONFIG).stagesPromptStagesRetrieve({
            stageUuid: pk,
        });
    }

    async send(data: PromptStage): Promise<PromptStage> {
        if (this.instance) {
            return new StagesApi(DEFAULT_CONFIG).stagesPromptStagesUpdate({
                stageUuid: this.instance.pk || "",
                promptStageRequest: data,
            });
        } else {
            return new StagesApi(DEFAULT_CONFIG).stagesPromptStagesCreate({
                promptStageRequest: data,
            });
        }
    }

    renderForm(): TemplateResult {
        return html` <span>
                ${msg(
                    "Show arbitrary input fields to the user, for example during enrollment. Data is saved in the flow context under the 'prompt_data' variable.",
                )}
            </span>
            <ak-form-element-horizontal label=${msg("Name")} required name="name">
                <input
                    type="text"
                    value="${ifDefined(this.instance?.name || "")}"
                    class="pf-c-form-control"
                    required
                />
            </ak-form-element-horizontal>
            <ak-form-group expanded>
                <span slot="header"> ${msg("Stage-specific settings")} </span>
                <div slot="body" class="pf-c-form">
                    <ak-form-element-horizontal label=${msg("Fields")} required name="fields">
                        <ak-dual-select-dynamic-selected
                            .provider=${promptFieldsProvider}
                            .selector=${makeFieldSelector(this.instance?.fields)}
                            available-label="${msg("Available Fields")}"
                            selected-label="${msg("Selected Fields")}"
                        ></ak-dual-select-dynamic-selected>
                        ${this.instance
                            ? html`<ak-forms-modal size=${PFSize.XLarge}>
                                  <span slot="submit"> ${msg("Create")} </span>
                                  <span slot="header"> ${msg("Create Prompt")} </span>
                                  <ak-prompt-form slot="form"> </ak-prompt-form>
                                  <button
                                      type="button"
                                      slot="trigger"
                                      class="pf-c-button pf-m-primary"
                                  >
                                      ${msg("Create")}
                                  </button>
                              </ak-forms-modal>`
                            : nothing}
                    </ak-form-element-horizontal>
                    <ak-form-element-horizontal
                        label=${msg("Validation Policies")}
                        name="validationPolicies"
                    >
                        <ak-dual-select-dynamic-selected
                            .provider=${policiesProvider}
                            .selector=${makePoliciesSelector(this.instance?.validationPolicies)}
                            available-label="${msg("Available Fields")}"
                            selected-label="${msg("Selected Fields")}"
                        ></ak-dual-select-dynamic-selected>
                        <p class="pf-c-form__helper-text">
                            ${msg(
                                "Selected policies are executed when the stage is submitted to validate the data.",
                            )}
                        </p>
                    </ak-form-element-horizontal>
                </div>
            </ak-form-group>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-stage-prompt-form": PromptStageForm;
    }
}
