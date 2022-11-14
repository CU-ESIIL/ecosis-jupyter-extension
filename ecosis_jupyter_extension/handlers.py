import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
import requests
import os
import re

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /ecosis_iframe_extension/get_example endpoint!"
        }))

class FileDownloadHandler(APIHandler):
    """
    Download EcoSIS Package from url
    """
    @tornado.web.authenticated
    def get(self):
        package_url = self.get_argument('packageUri')
        download_path = self.get_argument('downloadPath')
        if package_url is None:
            self.send_error(500, reason="package_url path is None")
        if download_path is None:
            self.send_error(500, reason="Download path is None")

        r = requests.get(package_url, allow_redirects=True)
        print("Got reqeust headers", r.headers)
        filename = self.get_filename_from_cd(r.headers.get('content-disposition'))
        filename = str(filename).replace('"', '')

        filepath = os.path.join(os.path.expanduser(download_path), filename)
        print("Filepath", filepath)
        with open(filepath, 'wb') as fw:
            fw.write(r.content)

        self.finish(f"{filepath}")

    def get_filename_from_cd(self, cd):
        """
        Get filename from content-disposition
        """
        if not cd:
            return None
        fname = re.findall('filename=(.+)', cd)
        if len(fname) == 0:
            return None
        return fname[0]



def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "ecosis_iframe_extension", "get_example")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
    web_app.add_handlers(host_pattern, [(url_path_join(base_url, "ecosis_iframe_extension", "download"),
                                         FileDownloadHandler)])
