import React from 'react';

import { makeStyles } from '../../styles/makeStyles';

import { PortalView, RevealView } from 'react-declarative';

import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

const useStyles = makeStyles()((theme) => ({
    root: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: theme.palette.background.default,
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 15,
        padding: 15,
    },
    container: {
        minWidth: 375,
        maxWidth: 375,
        padding: 15,
    },
    reveal: {
        width: 'unset',
    },
}));

export const ErrorPage = () => {
    const { classes } = useStyles();

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <PortalView>
            <Box className={classes.root}>
                <RevealView className={classes.reveal}>
                    <Paper className={classes.container}>
                        <Stack direction='column' gap="15px">
                            <span>
                                It looks like this app finished with uncaught exception<span className="emoji">😐</span><br />
                                Please reload this page and try again
                            </span>
                            <Button
                                variant="contained"
                                onClick={handleReload}
                            >
                                Reload page
                            </Button>
                        </Stack>
                    </Paper>
                </RevealView>
            </Box>
        </PortalView>
    );
};

export default ErrorPage;
