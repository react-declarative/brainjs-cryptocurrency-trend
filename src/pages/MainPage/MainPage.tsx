import React from "react";

import { AutoSizer } from "react-declarative";

import { makeStyles } from "../../styles/makeStyles";

import Card from "../../components/common/Card";
import Chart from "./Chart";

import Box from "@mui/material/Box";

import useInformer from "../../hooks/useInformer";

const CARD_LABEL = "KUKOIN ticker:ETH-USDT HIGH candle 1M";

const useStyles = makeStyles()((theme) => ({
  root: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    height: "85vmin",
    width: "100%",
  },
}));

export const MainPage = () => {
  const { classes } = useStyles();

  useInformer("train")

  return (
    <Box className={classes.root}>
      <Box className={classes.container}>
        <Card label={CARD_LABEL}>
          <AutoSizer>
            {({ height, width }) => <Chart height={height} width={width} />}
          </AutoSizer>
        </Card>
      </Box>
    </Box>
  );
};

export default MainPage;
