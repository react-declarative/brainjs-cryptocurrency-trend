import { useEffect, useRef } from "react";

import { makeStyles } from "../../styles/makeStyles";

import ClickAwayListener from "@mui/material/ClickAwayListener";
import Button from "@mui/material/Button";
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

export const UntrainedPage = () => {
  const { classes } = useStyles();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      window.location.reload();
    }, 15_000);
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleClickAway = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <Box className={classes.root}>
      <ClickAwayListener onClickAway={handleClickAway}>
        <Paper className={classes.container}>
          <Stack direction="column" gap="15px">
            <span>
              The trainment error is bigger than 0.3. That means the Crypto Whale was not collected or net is invalid.
              <span className="emoji">😐</span>
              <br />
              This page will auto-reload in 15 seconds
            </span>
            <Button variant="contained" onClick={handleReload}>
              Reload page
            </Button>
          </Stack>
        </Paper>
      </ClickAwayListener>
    </Box>
  );
};

export default UntrainedPage;
