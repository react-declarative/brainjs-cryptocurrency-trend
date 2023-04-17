import React from "react";

import { FieldType, IField } from "react-declarative";

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

const GROW_DESCRIPTION =
  "Tomorrow the price of your coin will start to rise. It's time to get few coins";

const FAIL_DESCRIPTION =
  "Tomorrow the price of your coin will start to fall. It's time to dump it";

const createDimension = (
  key: string,
  title: string,
  desc: string,
  Icon: React.ReactElement
): IField => ({
  type: FieldType.Paper,
  fieldRightMargin: "0",
  fieldBottomMargin: "1",
  //isVisible: (data) => !!data[key],
  style: {
    overflow: "hidden",
  },
  fields: [
    {
      type: FieldType.Typography,
      typoVariant: "body1",
      placeholder: title.toUpperCase(),
      fieldRightMargin: "0",
      fieldBottomMargin: "0",
    },
    {
      type: FieldType.Typography,
      fieldRightMargin: "0",
      fieldBottomMargin: "0",
      typoVariant: "body2",
      placeholder: desc,
      style: {
        minWidth: "260px",
      },
    },
    {
      type: FieldType.Typography,
      fieldRightMargin: "0",
      fieldBottomMargin: "0",
      typoVariant: "subtitle2",
      style: {
        color: "gray",
      },
      placeholder: "Consensus threshold for neural network",
    },
    {
      type: FieldType.Component,
      fieldRightMargin: "0",
      fieldBottomMargin: "0",
      element: () => (
        <Box display="flex" justifyContent="center">
          {Icon}
        </Box>
      ),
    },
    {
      type: FieldType.Progress,
      name: key,
    },
  ],
});

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
