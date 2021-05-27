import _ from 'lodash';
import { coreModule } from 'app/core/core';
import { MetricsPanelCtrl } from 'app/plugins/sdk';
import { AnnotationEvent } from '@grafana/data';
import { ReplyService } from './reply_service';
import { dateTime } from '@grafana/data';
// import { AnnotationsSrv } from './all';

export class ReplyEditorCtrl {
  panelCtrl: MetricsPanelCtrl;
  event: AnnotationEvent;
  timeRange: { from: number; to: number };
  form: any;
  close: any;
  timeFormated: string;

  /** @ngInject */
  constructor(private replySrv: ReplyService) {}

  $onInit() {
    this.event.panelId = this.panelCtrl.panel.id;
    this.event.dashboardId = this.panelCtrl.dashboard.id;

    // Annotations query returns time as Unix timestamp in milliseconds
    this.event.time = tryEpochToMoment(this.event.time);
    if (this.event.isRegion) {
      this.event.timeEnd = tryEpochToMoment(this.event.timeEnd);
    }

    this.timeFormated = this.panelCtrl.dashboard.formatDate(this.event.time!);
  }

  save() {
    if (!this.form.$valid) {
      return;
    }

    const saveModel = _.cloneDeep(this.event);
    saveModel.time = saveModel.time!.valueOf();
    saveModel.timeEnd = 0;

    if (saveModel.isRegion) {
      saveModel.timeEnd = this.event.timeEnd!.valueOf();

      if (saveModel.timeEnd < saveModel.time) {
        console.log('invalid time');
        return;
      }
    }

    if (saveModel.id) {
      this.replySrv
        .updateAnnotationEvent(saveModel)
        .then(() => {
          this.panelCtrl.refresh();
          this.close();
        })
        .catch(() => {
          this.panelCtrl.refresh();
          this.close();
        });
    } else {
      this.replySrv
        .saveAnnotationEvent(saveModel)
        .then(() => {
          this.panelCtrl.refresh();
          this.close();
        })
        .catch(() => {
          this.panelCtrl.refresh();
          this.close();
        });
    }
  }

  delete() {
    return this.replySrv
      .deleteAnnotationEvent(this.event)
      .then(() => {
        this.panelCtrl.refresh();
        this.close();
      })
      .catch(() => {
        this.panelCtrl.refresh();
        this.close();
      });
  }
}

function tryEpochToMoment(timestamp: any) {
  if (timestamp && _.isNumber(timestamp)) {
    const epoch = Number(timestamp);
    return dateTime(epoch);
  } else {
    return timestamp;
  }
}

export function replyEditor() {
  return {
    restrict: 'E',
    controller: ReplyEditorCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    templateUrl: 'public/app/features/reply/partials/reply_editor.html',
    scope: {
      panelCtrl: '=',
      event: '=',
      close: '&',
    },
  };
}

coreModule.directive('replyEditor', replyEditor);
