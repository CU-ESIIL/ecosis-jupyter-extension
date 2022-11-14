import {Dialog, showDialog} from "@jupyterlab/apputils";
import {FlexiblePopupWidget, ParamsPopupWidget} from "./widgets";
// import {PopupWidget} from "./custom-widget";

export function displaySearchParams(packageName: string, packageURI: string) {
  showDialog({
        body: new ParamsPopupWidget(packageName, packageURI),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' })]
    });
}

export function downloadSearchParams(packageName: string, packageURI: string) {
  showDialog({
        body: new ParamsPopupWidget(packageName, packageURI),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Ok' }), Dialog.cancelButton({label: 'Cancel'})]

    });
}

export function displayAlert(msg: string) {
    showDialog({
        title: 'Alert',
        body: new FlexiblePopupWidget(msg),
        focusNodeSelector: 'input',
        buttons: [Dialog.okButton({ label: 'Dismiss' })]
    })
}
