import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { Menu } from '@lumino/widgets';
import { IMainMenu } from '@jupyterlab/mainmenu';
import {PageConfig} from "@jupyterlab/coreutils";
import { INotification } from "jupyterlab_toastify";

import {IFrameWidget} from "./widgets";
import {request, RequestResult} from "./request";
import {displayAlert, displaySearchParams} from "./popups";


let ecosis_server = '';
var valuesUrl = new URL(PageConfig.getBaseUrl() + 'maapsec/environment');

request('get', valuesUrl.href).then((res: RequestResult) => {
    if (res.ok) {
        let environment = JSON.parse(res.data);
        ecosis_server = window.location.protocol + "//" + window.location.hostname + ":" + environment['ecosis_proxy_port'];
        console.log("Setting ecosis url as: ", ecosis_server)
    }
});
/**
 * Initialization data for the ecosis_iframe_extension extension.
 */
const extension: JupyterFrontEndPlugin<WidgetTracker<IFrameWidget>> = {
    id: 'ecosis_iframe_extension:plugin',
    autoStart: true,
    requires: [IMainMenu, ICommandPalette],
    activate: (app: JupyterFrontEnd,
               mainMenu: IMainMenu,
               palette: ICommandPalette): WidgetTracker<IFrameWidget> => {

        let widget: IFrameWidget;

        const namespace = 'ecosis-tracker-iframe';
        let instanceTracker = new WidgetTracker<IFrameWidget>({ namespace });
        let ecosis_url = ecosis_server
        console.log("Ecosis URL", ecosis_url)
        //
        // Listen for messages being sent by the iframe - parse the url and set as parameters for search
        //
        window.addEventListener("message", (event: MessageEvent) => {
            // if the message sent is the edsc url
            if (typeof event.data === "string"){
                ecosis_url = event.data;
                console.log("SSE event", event.data)
            }
        });

        const open_command = 'ecosis:open';
        app.commands.addCommand(open_command, {
            label: 'Open EcoSIS Iframe',
            isEnabled: () => true,
            execute: args => {
                console.log("OPen iframe ecosis", ecosis_server)
                if (widget == undefined) {
                    widget = new IFrameWidget(ecosis_server);
                    app.shell.add(widget, 'main');
                    app.shell.activateById(widget.id);
                } else {
                    // if user already has EDSC, just switch to tab
                    app.shell.add(widget, 'main');
                    app.shell.activateById(widget.id);
                }

                if (!instanceTracker.has(widget)) {
                    // Track the state of the widget for later restoration
                    instanceTracker.add(widget);
                }
                console.log(widget)
            }
        });
        palette.addItem({command: open_command, category: "EcoSIS"})

        const display_params_command = 'ecosis:displayParams';
        app.commands.addCommand(display_params_command, {
            label: 'View Selected Spectra Package',
            isEnabled: () => true,
            execute: args => {
                displayParams(ecosis_url)
            }});

        const download_package_command = 'ecosis:downloadPackage';
        app.commands.addCommand(download_package_command, {
            label: 'Download Selected Spectra Package',
            isEnabled: () => true,
            execute: args => {
                downloadPackage(ecosis_url)
            }});


        const { commands } = app
        console.log("Commands", commands)
        let searchMenu = new Menu({commands});
        console.log("Search menu", searchMenu)
        searchMenu.title.label = "EcoSIS Search";
        searchMenu.addItem({command: open_command})
        searchMenu.addItem({command: display_params_command})
        searchMenu.addItem({command: download_package_command})
        mainMenu.addMenu(searchMenu, {rank: 90})
        console.log('JupyterLab extension ecosis_iframe_extension is activated!');
        console.log(PageConfig.getOption('serverRoot'))

        return instanceTracker
    }
};

export default extension;

function displayParams(urlstring: string) {
    try {
        var packageURL = new URL(urlstring)
        console.log("URL", packageURL)
        if (packageURL.origin.includes(ecosis_server)) {
            if (packageURL.pathname.includes("/package")) {
                var packageName: any = packageURL.pathname.split("/").pop()
                var apiURL = "/api" + packageURL.pathname + "/export";
                var packageURI = new URL(apiURL, packageURL.origin).href;
                return displaySearchParams(packageName, packageURI)

            }
        }
        throw Error
    } catch (e) {
        displayAlert("Could not parse url data. <br/> " +
            "Please make sure to select a package on EcoSIS and copy the url. <br/>" +
            "Currently url: "+ urlstring)
    }
}

async function downloadPackage(urlstring: string) {
    try {
        var packageURL = new URL(urlstring)
        console.log("URL", urlstring)
        if (packageURL.origin.includes(ecosis_server)) {
            if (packageURL.pathname.includes("/package")) {
                var packageName = packageURL.pathname.split("/").pop()
                var apiURL = "/api" + packageURL.pathname + "/export";
                var packageURI = new URL(apiURL, packageURL.origin).href;

                let downloadEndpoint = "ecosis_iframe_extension/download";
                let url = new URL(PageConfig.getBaseUrl()+downloadEndpoint)
                let downloadPath = PageConfig.getOption('serverRoot')
                let downloadNotification = await INotification.inProgress("Downloading file: "+ packageName);
                request('get', url.href,
                    {"packageUri": packageURI, "downloadPath": downloadPath})
                    .then((res: RequestResult) => {
                        console.log(res)
                        if (res.ok) {
                            console.log("Data", res.data)
                            INotification.update({
                                toastId: downloadNotification,
                                message: "Download succeed",
                                type: "success",
                                autoClose: 3000
                            });
                            return
                        }
                        else {
                            INotification.update({
                                toastId: downloadNotification,
                                message: "Download failed" + res.data,
                                type: "error",
                                autoClose: 3000
                            });
                        }
                    });
            }
        }
        throw Error
    } catch (e) {
        displayAlert("Could not parse url data. <br/> " +
            "Please make sure to select a package on EcoSIS and copy the url. <br/>" +
            "Currently url: "+ urlstring)
    }
}
