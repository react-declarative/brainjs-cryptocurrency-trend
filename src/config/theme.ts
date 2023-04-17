import { createTheme } from "@mui/material";

export const THEME_LIGHT = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#1976d2",
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.54)",
      disabled: "rgba(0, 0, 0, 0.38)",
    },
    background: {
      default: "#fff",
      paper: "#f5f5f5",
    },
  },
});

export const THEME_DARK = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f48fb1',
    },
    secondary: {
      main: '#90cbf9',
    },
    text: {
      primary: "#fff",
      secondary: "rgba(255, 255, 255, 0.7)",
      disabled: "rgba(255, 255, 255, 0.5)",
    },
    background: {
      paper: "#424242",
      default: "#212121",
    },
  },
});

export default THEME_DARK;
