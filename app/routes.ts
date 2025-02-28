import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    layout("layouts/sidebar.tsx", [
        index("routes/home.tsx"),
        route("/chatSession/:sessionId", "routes/chatSession.tsx"),
    ]),
    
] satisfies RouteConfig;
