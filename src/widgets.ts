import { Widget } from '@lumino/widgets';

let unique = 0;

//
// Widget to display Earth Data Search Client inside an iframe
//
export
class IFrameWidget extends Widget {

  constructor(path: string) {
    super();
    this.id = path + '-' + unique;
    unique += 1;

    this.title.label = "EcoSIS Search";
    this.title.closable = true;

    let div = document.createElement('div');
    div.classList.add('iframe-widget');
    let iframe = document.createElement('iframe');
    iframe.id = "iframeid";
    iframe.src = path;

    div.appendChild(iframe);
    this.node.appendChild(div);
  }
};

//
// Widget to display selected search parameter
//
export
class ParamsPopupWidget extends Widget {
  constructor(packageName: string, packageURI: string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.innerHTML = "<pre>Package Name: " + packageName + "</pre><br>"
        + "<pre>Package URI: "+packageURI+"</pre>";
    super({ node: body });
  }
}

//
// Popup widget to display any string message
//
export class FlexiblePopupWidget extends Widget {
  constructor(text:string) {
    let body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.innerHTML = text;
    super({ node: body });
  }
}
