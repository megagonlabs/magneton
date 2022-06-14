from . import _WEB_MODULE
import idom


class Widget:

    def __init__(self):
        self.__widget = idom.web.export(_WEB_MODULE, "Widget")

    @idom.component
    def show(self):
        return self.__widget()