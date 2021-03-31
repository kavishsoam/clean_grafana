import { DataLinksInlineEditor, Input, RadioButtonGroup, Select, Switch, TextArea } from '@grafana/ui';
import { getPanelLinksVariableSuggestions } from 'app/features/panel/panellinks/link_srv';
import React from 'react';
import { RepeatRowSelect } from '../RepeatRowSelect/RepeatRowSelect';
import { OptionsPaneItemDescriptor } from './OptionsPaneItemDescriptor';
import { OptionsPaneCategoryDescriptor } from './OptionsPaneCategoryDescriptor';
import { OptionPaneRenderProps } from './types';

export function getPanelFrameCategory(props: OptionPaneRenderProps): OptionsPaneCategoryDescriptor {
  const { panel, onPanelConfigChange } = props;

  return new OptionsPaneCategoryDescriptor({
    title: 'Panel options',
    id: 'Panel options',
    isOpenDefault: true,
  })
    .addItem(
      new OptionsPaneItemDescriptor({
        title: 'Title',
        value: panel.title,
        popularRank: 1,
        Component: function renderTitle() {
          return (
            <Input
              id="PanelFrameTitle"
              defaultValue={panel.title}
              onBlur={(e) => onPanelConfigChange('title', e.currentTarget.value)}
            />
          );
        },
      })
    )
    .addItem(
      new OptionsPaneItemDescriptor({
        title: 'Description',
        description: panel.description,
        value: panel.description,
        Component: function renderDescription() {
          return (
            <TextArea
              defaultValue={panel.description}
              onBlur={(e) => onPanelConfigChange('description', e.currentTarget.value)}
            />
          );
        },
      })
    )
    .addItem(
      new OptionsPaneItemDescriptor({
        title: 'Transparent background',
        Component: function renderTransparent() {
          return (
            <Switch
              value={panel.transparent}
              onChange={(e) => onPanelConfigChange('transparent', e.currentTarget.checked)}
            />
          );
        },
      })
    )
    .addCategory(
      new OptionsPaneCategoryDescriptor({
        title: 'Panel links',
        id: 'Panel links',
        isOpenDefault: false,
        itemsCount: panel.links?.length,
      }).addItem(
        new OptionsPaneItemDescriptor({
          title: 'Panel links',
          Component: function renderLinks() {
            return (
              <DataLinksInlineEditor
                links={panel.links}
                onChange={(links) => onPanelConfigChange('links', links)}
                getSuggestions={getPanelLinksVariableSuggestions}
                data={[]}
              />
            );
          },
        })
      )
    )
    .addCategory(
      new OptionsPaneCategoryDescriptor({
        title: 'Repeat options',
        id: 'Repeat options',
        isOpenDefault: false,
      })
        .addItem(
          new OptionsPaneItemDescriptor({
            title: 'Repeat by variable',
            description:
              'Repeat this panel for each value in the selected variable. This is not visible while in edit mode. You need to go back to dashboard and then update the variable or reload the dashboard.',
            Component: function renderRepeatOptions() {
              return (
                <RepeatRowSelect
                  repeat={panel.repeat}
                  onChange={(value: string | null) => {
                    onPanelConfigChange('repeat', value);
                  }}
                />
              );
            },
          })
        )
        .addItem(
          new OptionsPaneItemDescriptor({
            title: 'Repeat direction',
            showIf: () => !!panel.repeat,
            Component: function renderRepeatOptions() {
              const directionOptions = [
                { label: 'Horizontal', value: 'h' },
                { label: 'Vertical', value: 'v' },
              ];

              return (
                <RadioButtonGroup
                  options={directionOptions}
                  value={panel.repeatDirection || 'h'}
                  onChange={(value) => onPanelConfigChange('repeatDirection', value)}
                />
              );
            },
          })
        )
        .addItem(
          new OptionsPaneItemDescriptor({
            title: 'Max per row',
            showIf: () => Boolean(panel.repeat && panel.repeatDirection === 'h'),
            Component: function renderOption() {
              const maxPerRowOptions = [2, 3, 4, 6, 8, 12].map((value) => ({ label: value.toString(), value }));
              return (
                <Select
                  options={maxPerRowOptions}
                  value={panel.maxPerRow}
                  onChange={(value) => onPanelConfigChange('maxPerRow', value.value)}
                />
              );
            },
          })
        )
    );
}
