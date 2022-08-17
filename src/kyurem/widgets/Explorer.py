from ..core.widget import WidgetBase, WidgetModel


class Explorer:
    def __init__(self, service, model=None):
        if model == None:
            model = WidgetModel.dotdict()

            # Transient/temporaty status, e.g., loading status
            model.status = {}

            # State/parameters of widget
            model.state = {}
            model.state.nodelabel = None
            model.state.nodetitle = None

            # Data in widget
            model.data = {}

            # Actions callable from widget
            model.actions = {}
            model.actions.filter_by_label = self.filter_by_label
            model.actions.filter_by_title = self.filter_by_title
            model.actions.filter_by_relation = self.filter_by_relation

            # Initialize view
            model.data.children = service.get_children_node_distributions()
            model.data.relations = service.get_relation_distribution()

        # Internal
        self.__service = service
        self.__widget = WidgetBase("Explorer", model=model)

        self.model = model

    async def filter_by_label(self, nodelabel):
        service = self.__service
        model = self.model

        model.data.schema = None
        model.state.nodelabel = nodelabel
        model.state.nodetitle = None

        model.status.children = {"loading": True}
        model.status.relations = {"loading": True}
        await self.__widget.flush()

        model.data.children = service.get_children_node_distributions(
            nodelabel, "title", nodelabel
        )
        if nodelabel:
            model.data.relations = service.get_node_degree_distributions(nodelabel)
        else:
            model.data.relations = service.get_relation_distribution()

        model.status.children = {}
        model.status.relations = {}

    async def filter_by_title(self, nodetitle):
        service = self.__service
        model = self.model

        model.state.nodetitle = nodetitle

        model.status.schema = {"loading": True}
        model.status.relations = {"loading": True}
        await self.__widget.flush()

        result = service.get_node_neighborhood(
            {
                "node_label": model.state.nodelabel
                if model.state.nodelabel
                else nodetitle,
                "node_property": "title",
                "node_property_value": nodetitle,
            }
        )
        model.data.schema = result["schema"]
        model.data.relations = [
            {"x": relation["label"], "y": relation["count"], "type": type}
            for type, relations in result["relation_dist"].items()
            for relation in relations
        ]

        model.status.schema = {}
        model.status.relations = {}

    async def filter_by_relation(self, type, direction):
        service = self.__service
        model = self.model

        model.status.schema = {"loading": True}
        model.status.children = {"loading": True}
        await self.__widget.flush()

        if model.state.nodelabel and model.state.nodetitle:
            node = {
                "node_label": model.state.nodelabel,
                "node_property": "title",
                "node_property_value": model.state.nodetitle,
            }
        else:
            node = None

        result = service.get_relation_neighborhood(
            node, {"type": type, "direction": direction}
        )

        model.data.schema = result["schema"]
        if not node:
            model.data.children = [
                {"x": x, "y": y} for x, y in result["node_dist"].items()
            ]

        model.status.schema = {}
        model.status.children = {}

    def show(self):
        return self.__widget.component()
