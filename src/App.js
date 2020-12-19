import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Drawer, CssBaseline, AppBar, Toolbar, Typography, Divider, Card, Dialog, DialogTitle, DialogActions, DialogContent, IconButton } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import { Close, ChevronRight, ExpandMore } from '@material-ui/icons';

import Tree from 'react-tree-graph';
import 'react-tree-graph/dist/style.css'
import './App.css';
import events from './events';

const drawerWidth = 220;
const useStyles = makeStyles( theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  toolbar: theme.mixins.toolbar,
  banner: {
    marginLeft: 20,
    marginTop: 20,
  },
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(3),
  },
  card: {
    maxWidth: 1050,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  videoTitle: {
    textAlign: 'center',
  },
}));

export default function ITTFWorldTours() {
  const classes = useStyles();
  const [videoID, setVideoID] = useState('u6AWxplF-OE');
  const [TTE, setTTE] = useState('5263'); // latest event ID
  const [group, setGroup] = useState('MS')
  const [open, setOpen] = useState(false);
  const [gameResult, setGameResult] = useState('馬龍 1:4 樊振東');
  let data = require('../JSON/' + TTE + group + '_tree.json');
  let videos = require('../JSON/' + TTE + group + '_videos.json');
  const handleClick = (event, node) => {
    setGameResult(node);
    setVideoID(videos[node]);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const groupName = {'MS': '男子單打', 'WS': '女子單打'};

  let event2020IDs = [5139, 5145, 5146, 5184, 5263]; // 2020 event IDs
  const node_2020_number = event2020IDs.length * 3 + 2;
  const TreeItems2020 = [];
  for (let i = 3; i < node_2020_number; i = i + 3) { // +3 when add a new event
    const event2020ID = event2020IDs.pop();
    const eventIDStr = event2020ID.toString();
    TreeItems2020.push(
      <TreeItem nodeId={i.toString()} label={events[eventIDStr]}>
        <TreeItem nodeId={(i+1).toString()} label='男單' onClick={() => {
            setTTE(eventIDStr);
            setGroup('MS');
          }} />
        <TreeItem nodeId={(i+2).toString()} label='女單' onClick={() => {
            setTTE(eventIDStr);
            setGroup('WS');
          }}/>
      </TreeItem>
    );
  }

  let event2019IDs = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010, 5011, 5012, 5013, 5014, 5015, 5016, 5017, 5018, 5019, 5020, 5021, 5022, 5023, 5025, 5026, 5028, 5030, 5069];
  const node_2019_number = event2019IDs.length * 3 + 102;
  const TreeItems2019 = [];
  for (let i = 103; i < node_2019_number; i = i + 3) {
    const event2019ID = event2019IDs.pop();
    console.log(event2019ID);
    const eventIDStr = event2019ID.toString();
    TreeItems2019.push(
      <TreeItem nodeId={i.toString()} label={events[eventIDStr]}>
        <TreeItem nodeId={(i+1).toString()} label='男單' onClick={() => {
            setTTE(eventIDStr);
            setGroup('MS');
          }} />
        <TreeItem nodeId={(i+2).toString()} label='女單' onClick={() => {
            setTTE(eventIDStr);
            setGroup('WS');
          }}/>
      </TreeItem>
    );
  }

  let event2018IDs = [2816, 2817, 2818, 2819, 2820, 2821, 2822, 2823, 2824, 2825, 2873];
  const node_2018_number = event2018IDs.length * 3 + 201;
  const TreeItems2018 = [];
  for (let i = 202; i < node_2018_number; i = i + 3) {
    const event2018ID = event2018IDs.pop();
    const eventIDStr = event2018ID.toString();
    TreeItems2018.push(
      <TreeItem nodeId={i.toString()} label={events[eventIDStr]}>
        <TreeItem nodeId={(i+1).toString()} label='男單' onClick={() => {
            setTTE(eventIDStr);
            setGroup('MS');
          }} />
        <TreeItem nodeId={(i+2).toString()} label='女單' onClick={() => {
            setTTE(eventIDStr);
            setGroup('WS');
          }}/>
      </TreeItem>
    );
  }

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position='fixed' className={classes.appBar}>
        <Toolbar>
          <Typography variant='h6' noWrap>
            點擊節點可觀看比賽影片。若想找人討論比賽歡迎前往 <a href='https://www.facebook.com/groups/641046076724027' target='_blank' rel='noopener noreferrer'>台灣桌球論壇</a>
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant='permanent'
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor='left'
      >
        <div className={classes.toolbar}>
          <Typography variant='h6' noWrap className={classes.banner}>
          國際桌總世界巡迴賽
          </Typography>
        </div>
        <Divider />
        <TreeView
          className={classes.root}
          defaultExpanded={['1', '2', '3', '101','201']}
          defaultCollapseIcon={<ExpandMore />}
          defaultExpandIcon={<ChevronRight />}
        >
          <TreeItem nodeId='1' label='歷年世界巡迴賽'>
            <TreeItem nodeId='2' label='2020'>
              {TreeItems2020}
            </TreeItem>
            <TreeItem nodeId='101' label='2019'>
              {TreeItems2019}
            </TreeItem>
            <TreeItem nodeId='201' label='2018'>
              {TreeItems2018}
            </TreeItem>
          </TreeItem>
        </TreeView>
      </Drawer>

      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Typography variant='h6' noWrap>
          {TTE > 4999 ? (TTE > 5100 ? 2020 : 2019) : 2018} / {events[TTE.toString()]} / {groupName[group]}
        </Typography>

        <Card className={classes.card}>
          <Tree
            className='node'
            data={data}
            nodeRadius={15}
            margins={{ top: 30, bottom: 10, left: 20, right: 250 }}
            gProps={{
                onClick: handleClick
            }}
            textProps={{x: -25, y: 25}}
            height={640}
            width={1000}/>
        </Card>
      </main>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth='xl'
        scroll='body'
        aria-labelledby='alert-dialog-title'
      >
        <DialogTitle>
          <Typography className={classes.videoTitle} variant='h4'>{gameResult}</Typography>
          {open ? (
            <IconButton aria-label='close' className={classes.closeButton} onClick={handleClose}>
              <Close />
            </IconButton>
          ) : null}
        </DialogTitle>
        <DialogContent>
            <iframe
              title='Youtube Video'
              height='720'
              width = '1280'
              src={videoID ? 'https://www.youtube.com/embed/' + videoID : './404.html'}
              allow='autoplay; encrypted-media'
              allowFullScreen
            />
        </DialogContent>
        <DialogActions>
        </DialogActions>
      </Dialog>
    </div>
  );
}