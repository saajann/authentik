import { DEFAULT_CONFIG } from "@goauthentik/common/api/config";
import { severityToLabel } from "@goauthentik/common/labels";
import "@goauthentik/elements/ak-dual-select/ak-dual-select-dynamic-selected-provider.js";
import { DualSelectPair } from "@goauthentik/elements/ak-dual-select/types";
import "@goauthentik/elements/forms/HorizontalFormElement";
import { ModelForm } from "@goauthentik/elements/forms/ModelForm";
import "@goauthentik/elements/forms/Radio";
import "@goauthentik/elements/forms/SearchSelect";

import { msg } from "@lit/localize";
import { TemplateResult, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

import {
    CoreApi,
    CoreGroupsListRequest,
    EventsApi,
    Group,
    NotificationRule,
    NotificationTransport,
    PaginatedNotificationTransportList,
    SeverityEnum,
} from "@goauthentik/api";

async function eventTransportsProvider(page = 1, search = "") {
    const eventTransports = await new EventsApi(DEFAULT_CONFIG).eventsTransportsList({
        ordering: "name",
        pageSize: 20,
        search: search.trim(),
        page,
    });

    return {
        pagination: eventTransports.pagination,
        options: eventTransports.results.map((transport) => [transport.pk, transport.name]),
    };
}

export function makeTransportSelector(instanceTransports: string[] | undefined) {
    const localTransports = instanceTransports ? new Set(instanceTransports) : undefined;

    return localTransports
        ? ([pk, _]: DualSelectPair) => localTransports.has(pk)
        : ([_0, _1, _2, stage]: DualSelectPair<NotificationTransport>) => stage !== undefined;
}
@customElement("ak-event-rule-form")
export class RuleForm extends ModelForm<NotificationRule, string> {
    eventTransports?: PaginatedNotificationTransportList;

    loadInstance(pk: string): Promise<NotificationRule> {
        return new EventsApi(DEFAULT_CONFIG).eventsRulesRetrieve({
            pbmUuid: pk,
        });
    }

    async load(): Promise<void> {
        this.eventTransports = await new EventsApi(DEFAULT_CONFIG).eventsTransportsList({
            ordering: "name",
        });
    }

    getSuccessMessage(): string {
        return this.instance
            ? msg("Successfully updated rule.")
            : msg("Successfully created rule.");
    }

    async send(data: NotificationRule): Promise<NotificationRule> {
        if (this.instance) {
            return new EventsApi(DEFAULT_CONFIG).eventsRulesUpdate({
                pbmUuid: this.instance.pk || "",
                notificationRuleRequest: data,
            });
        } else {
            return new EventsApi(DEFAULT_CONFIG).eventsRulesCreate({
                notificationRuleRequest: data,
            });
        }
    }

    renderForm(): TemplateResult {
        return html` <ak-form-element-horizontal label=${msg("Name")} required name="name">
                <input
                    type="text"
                    value="${ifDefined(this.instance?.name)}"
                    class="pf-c-form-control"
                    required
                />
            </ak-form-element-horizontal>
            <ak-form-element-horizontal label=${msg("Group")} name="group">
                <ak-search-select
                    .fetchObjects=${async (query?: string): Promise<Group[]> => {
                        const args: CoreGroupsListRequest = {
                            ordering: "name",
                            includeUsers: false,
                        };
                        if (query !== undefined) {
                            args.search = query;
                        }
                        const groups = await new CoreApi(DEFAULT_CONFIG).coreGroupsList(args);
                        return groups.results;
                    }}
                    .renderElement=${(group: Group): string => {
                        return group.name;
                    }}
                    .value=${(group: Group | undefined): string | undefined => {
                        return group?.pk;
                    }}
                    .selected=${(group: Group): boolean => {
                        return group.pk === this.instance?.group;
                    }}
                    blankable
                >
                </ak-search-select>
                <p class="pf-c-form__helper-text">
                    ${msg(
                        "Select the group of users which the alerts are sent to. If no group is selected the rule is disabled.",
                    )}
                </p>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal label=${msg("Transports")} required name="transports">
                <ak-dual-select-dynamic-selected
                    .provider=${eventTransportsProvider}
                    .selector=${makeTransportSelector(this.instance?.transports)}
                    available-label="${msg("Available Transports")}"
                    selected-label="${msg("Selected Transports")}"
                ></ak-dual-select-dynamic-selected>
                <p class="pf-c-form__helper-text">
                    ${msg(
                        "Select which transports should be used to notify the user. If none are selected, the notification will only be shown in the authentik UI.",
                    )}
                </p>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal label=${msg("Severity")} required name="severity">
                <ak-radio
                    .options=${[
                        {
                            label: severityToLabel(SeverityEnum.Alert),
                            value: SeverityEnum.Alert,
                            default: true,
                        },
                        {
                            label: severityToLabel(SeverityEnum.Warning),
                            value: SeverityEnum.Warning,
                        },
                        {
                            label: severityToLabel(SeverityEnum.Notice),
                            value: SeverityEnum.Notice,
                        },
                    ]}
                    .value=${this.instance?.severity}
                >
                </ak-radio>
            </ak-form-element-horizontal>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-event-rule-form": RuleForm;
    }
}
