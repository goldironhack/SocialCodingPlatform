import React from "react";
import Timeline from "./timeline";
import ComponentLoader from "./component-loader";
import AdminView from "./admin";
import Scores from "./scores";
import ProjectEditor from "./project-editor";
import ViewProject from "./view-project";

ComponentLoader.register("timeline", <Timeline />);
ComponentLoader.register("admin-view", <AdminView />);
ComponentLoader.register("scores", <Scores />);
ComponentLoader.register("project-editor", <ProjectEditor />);
ComponentLoader.register("view-project", <ViewProject />);