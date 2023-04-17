import React from "react";

import { makeStyles } from "../../styles/makeStyles";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

const useStyles = makeStyles()((theme) => ({
  root: {
    height: "100%",
    width: "100%",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    gap: 15,
    padding: 15,
  },
  container: {
    minWidth: 375,
    maxWidth: 375,
    padding: 15,
  },
}));

export const MainPage = () => {
  const { classes } = useStyles();
  return (
    <Box className={classes.root}>
      <Paper className={classes.container}>
        <Stack direction="column" gap="15px">
          <span>mainpage</span>
        </Stack>
      </Paper>
    </Box>
  );
};

export default MainPage;
