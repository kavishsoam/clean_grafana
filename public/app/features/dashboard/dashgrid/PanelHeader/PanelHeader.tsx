/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { DataLink, LoadingState, PanelData, PanelMenuItem, QueryResultMetaNotice, ScopedVars } from '@grafana/data';
import { AngularComponent, config, getTemplateSrv } from '@grafana/runtime';
import { ClickOutsideWrapper, Icon, IconName, Tooltip, stylesFactory } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';

import PanelHeaderCorner from './PanelHeaderCorner';
import { PanelHeaderMenu } from './PanelHeaderMenu';

import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';
import { PanelModel } from 'app/features/dashboard/state/PanelModel';
import { getPanelLinksSupplier } from 'app/features/panel/panellinks/linkSuppliers';
import { getPanelMenu } from 'app/features/dashboard/utils/getPanelMenu';
import { updateLocation } from 'app/core/actions';
import { css } from 'emotion';
import { contextSrv } from 'app/core/core';

export interface Props {
  panel: PanelModel;
  dashboard: DashboardModel;
  title?: string;
  description?: string;
  scopedVars?: ScopedVars;
  angularComponent?: AngularComponent | null;
  links?: DataLink[];
  error?: string;
  alertState?: string;
  isViewing: boolean;
  isEditing: boolean;
  data: PanelData;
  updateLocation: typeof updateLocation;
}

interface ClickCoordinates {
  x: number;
  y: number;
}

interface State {
  panelMenuOpen: boolean;
  menuItems: PanelMenuItem[];
}

export class PanelHeader extends PureComponent<Props, State> {
  clickCoordinates: ClickCoordinates = { x: 0, y: 0 };

  state: State = {
    panelMenuOpen: false,
    menuItems: [],
  };

  eventToClickCoordinates = (event: React.MouseEvent<HTMLDivElement>) => {
    return {
      x: Math.floor(event.clientX),
      y: Math.floor(event.clientY),
    };
  };

  onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    this.clickCoordinates = this.eventToClickCoordinates(event);
  };

  isClick = (clickCoordinates: ClickCoordinates) => {
    return clickCoordinates.x === this.clickCoordinates.x && clickCoordinates.y === this.clickCoordinates.y;
  };

  onMenuToggle = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!this.isClick(this.eventToClickCoordinates(event))) {
      return;
    }

    event.stopPropagation();

    const { dashboard, panel, angularComponent } = this.props;
    const menuItems = getPanelMenu(dashboard, panel, angularComponent);

    this.setState({
      panelMenuOpen: !this.state.panelMenuOpen,
      menuItems,
    });
  };

  closeMenu = () => {
    this.setState({
      panelMenuOpen: false,
    });
  };

  onCancelQuery = () => {
    this.props.panel.getQueryRunner().cancelQuery();
  };

  renderLoadingState(state: LoadingState): JSX.Element | null {
    if (state === LoadingState.Loading) {
      return (
        <div className="panel-loading" onClick={this.onCancelQuery}>
          <Tooltip content="Cancel query">
            <Icon className="panel-loading__spinner spin-clockwise" name="sync" />
          </Tooltip>
        </div>
      );
    }

    if (state === LoadingState.Streaming) {
      const styles = getStyles();

      return (
        <div className="panel-loading" onClick={this.onCancelQuery}>
          <div title="Streaming (click to stop)" className={styles.streamIndicator} />
        </div>
      );
    }

    return null;
  }

  openInspect = (e: React.SyntheticEvent, tab: string) => {
    const { updateLocation, panel } = this.props;

    e.stopPropagation();

    updateLocation({
      query: { inspect: panel.id, inspectTab: tab },
      partial: true,
    });
  };

  // This will show one icon for each severity
  renderNotice = (notice: QueryResultMetaNotice) => {
    let iconName: IconName = 'info-circle';
    if (notice.severity === 'error' || notice.severity === 'warning') {
      iconName = 'exclamation-triangle';
    }

    return (
      <Tooltip content={notice.text} key={notice.severity}>
        {notice.inspect ? (
          <div className="panel-info-notice pointer" onClick={e => this.openInspect(e, notice.inspect!)}>
            <Icon name={iconName} style={{ marginRight: '8px' }} />
          </div>
        ) : (
          <a className="panel-info-notice" href={notice.link} target="_blank" rel="noreferrer">
            <Icon name={iconName} style={{ marginRight: '8px' }} />
          </a>
        )}
      </Tooltip>
    );
  };

  render() {
    const { panel, scopedVars, error, isViewing, isEditing, data, alertState } = this.props;
    const { menuItems } = this.state;
    const title = getTemplateSrv().replace(panel.title, scopedVars, 'text');

    const panelHeaderClass = classNames({
      'panel-header': true,
      'grid-drag-handle': !(isViewing || isEditing),
    });

    // dedupe on severity
    const notices: Record<string, QueryResultMetaNotice> = {};

    for (const series of data.series) {
      if (series.meta && series.meta.notices) {
        for (const notice of series.meta.notices) {
          notices[notice.severity] = notice;
        }
      }
    }

    return (
      <>
        {this.renderLoadingState(data.state)}
        <div className={panelHeaderClass}>
          <PanelHeaderCorner
            panel={panel}
            title={panel.title}
            description={panel.description}
            scopedVars={panel.scopedVars}
            links={getPanelLinksSupplier(panel)}
            error={error}
          />
          <div
            className="panel-title-container"
            onClick={this.onMenuToggle}
            onMouseDown={this.onMouseDown}
            aria-label={selectors.components.Panels.Panel.title(title)}
          >
            <div className="panel-title">
              {Object.values(notices).map(this.renderNotice)}
              {alertState && (
                <Icon
                  name={alertState === 'alerting' ? 'heart-break' : 'heart'}
                  className="icon-gf panel-alert-icon"
                  style={{ marginRight: '4px' }}
                  size="sm"
                />
              )}
              <span className="panel-title-text">{title}</span>
              {contextSrv.user.isGrafanaAdmin ? <div>
                <Icon name="angle-down" className="panel-menu-toggle" />
              {this.state.panelMenuOpen && (
                <ClickOutsideWrapper onClick={this.closeMenu} parent={document}>
                  <PanelHeaderMenu items={menuItems} />
                </ClickOutsideWrapper>
              )}
              </div>: null}
            
              {data.request && data.request.timeInfo && (
                <span className="panel-time-info">
                  <Icon name="clock-nine" size="sm" /> {data.request.timeInfo}
                </span>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
}

/*
 * Styles
 */
export const getStyles = stylesFactory(() => {
  return {
    streamIndicator: css`
      width: 10px;
      height: 10px;
      background: ${config.theme.colors.textFaint};
      box-shadow: 0 0 2px ${config.theme.colors.textFaint};
      border-radius: 50%;
      position: relative;
      top: 6px;
      right: 1px;
    `,
  };
});
