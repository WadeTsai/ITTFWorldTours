import React, {useState} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import Card from '@material-ui/core/Card';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Tree from 'react-tree-graph';
import 'react-tree-graph/dist/style.css'
import './App.css';
import events2018 from './events2018';
import events2019 from './events2019';

const drawerWidth = 220;
const useStyles = makeStyles(theme => ({
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
  const [TTE, setTTE] = useState('5013');
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

  let event2019ID = 5014;
  const TreeItems2019 = [];
  for (let i = 3; i < 43; i = i + 3) {
    event2019ID = event2019ID -1;
    const eventIDStr = event2019ID.toString();
    TreeItems2019.push(
      <TreeItem nodeId={i.toString()} label={events2019[eventIDStr]}>
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

  let event2018ID = 2826;
  const TreeItems2018 = [];
  for (let i = 102; i < 132; i = i + 3) {
    event2018ID = event2018ID -1;
    const eventIDStr = event2018ID.toString();
    TreeItems2018.push(
      <TreeItem nodeId={i.toString()} label={events2018[eventIDStr]}>
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
            點擊節點可觀看比賽影片。若想找人討論比賽歡迎前往 <a href='https://www.facebook.com/groups/641046076724027' target='_blank'>台灣桌球論壇</a>
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
          defaultExpanded={['1', '2', '3', '101']}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          <TreeItem nodeId='1' label='歷年世界巡迴賽'>
            <TreeItem nodeId='2' label='2019'>
              {TreeItems2019}
            </TreeItem>
            <TreeItem nodeId='101' label='2018'>
              {TreeItems2018}
            </TreeItem>
          </TreeItem>
        </TreeView>
      </Drawer>

      <main className={classes.content}>
        <div className={classes.toolbar} />
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
              <CloseIcon />
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