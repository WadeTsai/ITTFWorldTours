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
    maxWidth: 1000,
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
          defaultExpanded={['1', '2', '3']}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          <TreeItem nodeId='1' label='歷年世界巡迴賽'>
            <TreeItem nodeId='2' label='2019'>
              <TreeItem nodeId='3' label='年終總決賽'>
                <TreeItem nodeId='4' label='男單' onClick={() => {
                    setTTE('5013');
                    setGroup('MS');
                  }} />
                <TreeItem nodeId='5' label='女單' onClick={() => {
                    setTTE('5013');
                    setGroup('WS');
                  }}/>
              </TreeItem>
              <TreeItem nodeId='6' label='奧地利公開賽'>
                <TreeItem nodeId='7' label='男單' onClick={() => {
                    setTTE('5012');
                    setGroup('MS');
                  }} />
                <TreeItem nodeId='8' label='女單' onClick={() => {
                    setTTE('5012');
                    setGroup('WS');
                  }}/>
              </TreeItem>
              <TreeItem nodeId='9' label='德國公開賽'>
                <TreeItem nodeId='10' label='男單' onClick={() => {
                    setTTE('5011');
                    setGroup('MS');
                  }} />
                <TreeItem nodeId='11' label='女單' onClick={() => {
                    setTTE('5011');
                    setGroup('WS');
                  }}/>
              </TreeItem>
              <TreeItem nodeId='12' label='瑞典公開賽'>
                <TreeItem nodeId='13' label='男單' onClick={() => {
                    setTTE('5010');
                    setGroup('MS');
                  }} />
                <TreeItem nodeId='14' label='女單' onClick={() => {
                    setTTE('5010');
                    setGroup('WS');
                  }}/>
              </TreeItem>
              <TreeItem nodeId='15' label='捷克公開賽'>
                <TreeItem nodeId='16' label='男單' onClick={() => {
                    setTTE('5009');
                    setGroup('MS');
                  }} />
                <TreeItem nodeId='17' label='女單' onClick={() => {
                    setTTE('5009');
                    setGroup('WS');
                  }}/>
              </TreeItem>

            </TreeItem>
            <TreeItem nodeId='101' label='2018'>
              <TreeItem nodeId='102' label='待補' />
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
            margins={{ top: 30, bottom: 10, left: 20, right: 120 }}
            gProps={{
                onClick: handleClick
            }}
            textProps={{x: -25, y: 25}}
            height={640}
            width={900}/>
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