import React, { FC, useState } from 'react';
import { GrafanaTheme, SelectableValue } from '@grafana/data';
import { PageToolbar, ToolbarButton, stylesFactory, Form } from '@grafana/ui';
import { css } from 'emotion';

import { config } from 'app/core/config';
import AlertTypeSection from './components/AlertTypeSection';
import AlertConditionsSection from './components/AlertConditionsSection';
import AlertDetails from './components/AlertDetails';
import Expression from './components/Expression';

import { fetchRulerRulesNamespace, setRulerRuleGroup } from './api/ruler';
import { RulerRuleDTO, RulerRuleGroupDTO } from 'app/types/unified-alerting/dto';

type Props = {};

interface AlertRuleFormFields {
  name: string;
  type: SelectableValue;
  folder: SelectableValue;
  forTime: string;
  datasource: SelectableValue;
  expression: string;
  timeUnit: SelectableValue;
  labels: Array<{ key: string; value: string }>;
  annotations: Array<{ key: SelectableValue; value: string }>;
}

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    fullWidth: css`
      width: 100%;
    `,
    formWrapper: css`
      padding: 0 ${theme.spacing.md};
    `,
    formInput: css`
      width: 400px;
      & + & {
        margin-left: ${theme.spacing.sm};
      }
    `,
    flexRow: css`
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
    `,
  };
});

const AlertEditor: FC<Props> = () => {
  const styles = getStyles(config.theme);

  const [folder, setFolder] = useState<{ namespace: string; group: string }>();

  const handleSubmit = (alertRule: AlertRuleFormFields) => {
    const { name, expression, forTime, datasource, timeUnit, labels, annotations } = alertRule;
    const { namespace, group: groupName } = folder || {};
    if (namespace && groupName) {
      fetchRulerRulesNamespace(datasource?.value, namespace)
        .then((ruleGroup) => {
          const group: RulerRuleGroupDTO = ruleGroup.find(({ name }) => name === groupName) || {
            name: groupName,
            rules: [] as RulerRuleDTO[],
          };
          const alertRule: RulerRuleDTO = {
            alert: name,
            expr: expression,
            for: `${forTime}${timeUnit.value}`,
            labels: labels.reduce((acc, { key, value }) => {
              if (key && value) {
                acc[key] = value;
              }
              return acc;
            }, {} as Record<string, string>),
            annotations: annotations.reduce((acc, { key, value }) => {
              if (key && value) {
                acc[key.value] = value;
              }
              return acc;
            }, {} as Record<string, string>),
          };

          group.rules = group?.rules.concat(alertRule);
          return setRulerRuleGroup(datasource?.value, namespace, group);
        })
        .then(() => {
          console.log('Alert rule saved successfully');
        })
        .catch((error) => console.error(error));
    }
  };
  return (
    <Form
      onSubmit={handleSubmit}
      className={styles.fullWidth}
      defaultValues={{ labels: [{ key: '', value: '' }], annotations: [{ key: {}, value: '' }] }}
    >
      {(formApi) => (
        <>
          <PageToolbar title="Create alert rule" pageIcon="bell">
            <ToolbarButton variant="primary" type="submit">
              Save
            </ToolbarButton>
            <ToolbarButton variant="primary">Save and exit</ToolbarButton>
            <ToolbarButton variant="destructive">Cancel</ToolbarButton>
          </PageToolbar>
          <div className={styles.formWrapper}>
            <AlertTypeSection {...formApi} setFolder={setFolder} />
            <Expression {...formApi} />
            <AlertConditionsSection {...formApi} />
            <AlertDetails {...formApi} />
          </div>
        </>
      )}
    </Form>
  );
};

export default AlertEditor;
