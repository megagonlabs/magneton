from ..core.widget import WidgetModel
from .ReducerWidget import ReducerWidget


class Explorer:
    def __init__(self, actions, base_schema):
        def filter_by_label(state, nodelabel=None):
            # Update which node/bar is highlighted
            state.nodelabel = nodelabel
            state.nodetitle = None
            state.relation = None

            # Set loading indicator
            state.is_loading = True

            # Render component
            yield state

            # Fetch data
            data = actions["filter_by_label"](state, nodelabel)

            # Assign data to state
            WidgetModel.dict(state.data).update(data)

            # Remove loading indicator
            del state["is_loading"]

            # Render component
            yield state

        def filter_by_title(state, nodetitle=None):
            state.nodetitle = nodetitle
            state.is_loading = True
            yield state

            data = actions["filter_by_title"](state, nodetitle)
            WidgetModel.dict(state.data).update(data)
            del state["is_loading"]
            yield state

        def filter_by_relation(state, type, direction=None):
            state.relation = {"type": type, "direction": direction}
            state.is_loading = True
            yield state

            data = actions["filter_by_relation"](state, type, direction)
            WidgetModel.dict(state.data).update(data)
            del state["is_loading"]
            yield state

        self.__widget = ReducerWidget(
            "Explorer",
            {"data": {"base_schema": base_schema}},
            {
                "filter_by_label": filter_by_label,
                "filter_by_title": filter_by_title,
                "filter_by_relation": filter_by_relation,
            },
        )

        for state in filter_by_label(self.__widget.model.state):
            self.__widget.model.state = state

    @property
    def history(self):
        return self.__widget.history

    def show(self):
        return self.__widget.component()
