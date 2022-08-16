from ..core.widget import WidgetBase, WidgetModel


class Explorer:
    def __init__(self, service, model=None):
        if model == None:
            model = WidgetModel.dotdict()
        self.model = model

        # Transient/temporaty status, e.g., loading status
        self.model.status = {}

        # State/parameters of widget
        self.model.state = {}

        # Data in widget
        self.model.data = {}

        # Actions callable from widget
        self.model.actions = {}
        self.model.actions.filter_by_type = self.filter_by_type
        self.model.actions.filter_by_title = self.filter_by_title
        self.model.actions.filter_by_relation = self.filter_by_relation

        # Internal
        self.__service = service
        self.__widget = WidgetBase("Explorer", model=self.model)

    async def filter_by_type(self, nodetype):
        service = self.__service
        model = self.model

        model.status.children = {"loading": True}
        model.status.relations = {"loading": True}
        await self.__widget.flush()

        model.state.nodetype = nodetype
        model.data.children = service.get_children_node_distributions(
            nodetype, "title", nodetype
        )
        if nodetype:
            model.data.relations = service.get_node_degree_distributions(nodetype)
        else:
            model.data.relations = service.get_relation_distribution()

        model.status.children = {}
        model.status.relations = {}

    async def filter_by_title(self, nodetitle):
        service = self.__service
        model = self.model

        model.status.schema = {"loading": True}
        model.status.relations = {"loading": True}
        await self.__widget.flush()

        model.state.nodetype = nodetitle
        result = service.get_node_neighborhood(
            {
                "node_label": model.state.nodetype
                if model.state.nodetype
                else nodetitle,
                "node_property": "title",
                "node_property_value": nodetitle,
            }
        )
        model.data.schema = result["schema"]
        model.data.relations = [
            {"x": key, "y": attr["count"], "type": attr["type"]}
            for key, attr in result["relation_dist"]
        ]

        model.status.schema = {}
        model.status.relations = {}

    async def filter_by_relation(self, type, direction):
        service = self.__service
        model = self.model

        model.status.schema = {"loading": True}
        model.status.children = {"loading": True}
        await self.__widget.flush()

        result = service.get_relation_neighborhood(
            None, {"type": type, "direction": direction}
        )
        model.data.schema = result["schema"]
        model.data.children = [{"x": x, "y": y} for x, y in result["node_dist"].items()]

        model.status.schema = {}
        model.status.children = {}

    def show(self):
        return self.__widget.component()
