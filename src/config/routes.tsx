import { ISwitchItem } from "react-declarative";

import ErrorPage from "../pages/ErrorPage/ErrorPage";
import UntrainedPage from "../pages/UntrainedPage/UntrainedPage";
import SetupPage from "../pages/SetupPage/SetupPage";
import MainPage from "../pages/MainPage/MainPage";

import { netManager, trainManager } from "../lib/schema";

export const routes: ISwitchItem[] = [
  {
    path: "/",
    redirect: () => {
      if (netManager.getValue() && trainManager.getValue()) {
        return "/main-page";
      }
      return "/setup-page";
    }
  },
  {
    path: "/setup-page",
    element: SetupPage,
  },
  {
    path: "/main-page",
    element: MainPage,
  },
  {
    path: "/error-page",
    element: ErrorPage,
  },
  {
    path: "/untrained-page",
    element: UntrainedPage,
  },
];

export default routes;
