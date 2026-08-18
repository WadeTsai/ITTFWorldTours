import { useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  AppBar,
  Box,
  Card,
  CssBaseline,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Tree } from 'react-tree-graph';

import 'react-tree-graph/dist/style.css';
import './App.css';
import { getTree, getVideos } from './data';
import {
  GROUP_NAMES,
  LATEST_EVENT_ID,
  SEASONS,
  eventName,
  groupsOf,
  seasonOf,
} from './events';
import type { ActiveMatch, Group } from './types';

/** Sidebar labels, shorter than the `GROUP_NAMES` used in the heading. */
const DRAW_LABELS: Record<Group, string> = { MS: '男單', WS: '女單' };

// Wide enough for the WTT event names, which run a lot longer than the
// four-or-five character Chinese names of the older ITTF events.
const DRAWER_WIDTH = 300;
const FORUM_URL = 'https://www.facebook.com/groups/641046076724027';

type TreeGraphProps = ComponentProps<typeof Tree>;

/**
 * `@types/react-tree-graph` describes these slots with `HTMLProps`, which has no
 * SVG geometry attributes, so the literals are asserted into place. `nodeRadius`
 * was removed in react-tree-graph v8 — the radius is now an ordinary `r` attribute.
 */
// react-tree-graph puts `className="node"` on every node group itself, which is
// what the rules in App.css hang off, so no className has to be passed in.
const NODE_PROPS = { r: 15 } as TreeGraphProps['nodeProps'];
const TEXT_PROPS = { x: -25, y: 25 } as TreeGraphProps['textProps'];
const TREE_MARGINS = { top: 30, bottom: 10, left: 20, right: 250 };

/** Sidebar item ids. A draw id doubles as the payload for the click handler. */
const drawItemId = (eventId: string, group: Group) => `draw-${eventId}-${group}`;
// The id is not digits-only: legacy ITTF events carry an `ittf` prefix where
// their number collides with a WTT one. See the note in `data.ts`.
const DRAW_ITEM_ID = /^draw-([\w-]+)-(MS|WS)$/;

const DEFAULT_EXPANDED = [
  'tours',
  ...SEASONS.map((season) => `season-${season.year}`),
  `event-${LATEST_EVENT_ID}`,
];

export default function ITTFWorldTours() {
  const [eventId, setEventId] = useState(LATEST_EVENT_ID);
  // Not a hard-coded 'MS': the gender-split Finals of 2023 and 2024 ran a single
  // draw each, so the newest event on record is not guaranteed to have a men's
  // one to open on.
  const [group, setGroup] = useState<Group>(groupsOf(LATEST_EVENT_ID)[0] ?? 'MS');
  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null>(null);

  const bracket = useMemo(() => getTree(eventId, group), [eventId, group]);
  const videos = useMemo(() => getVideos(eventId, group), [eventId, group]);

  const handleItemClick = (_event: React.MouseEvent, itemId: string) => {
    const match = DRAW_ITEM_ID.exec(itemId);
    if (!match) {
      return;
    }
    const [, nextEventId, nextGroup] = match;
    if (nextEventId && nextGroup) {
      setEventId(nextEventId);
      setGroup(nextGroup as Group);
    }
  };

  const handleNodeClick = (_event: unknown, matchName: string) => {
    setActiveMatch({ name: matchName, videoId: videos[matchName] });
  };

  const closeDialog = () => setActiveMatch(null);

  const season = seasonOf(eventId);
  const videoSrc = activeMatch?.videoId
    ? `https://www.youtube.com/embed/${activeMatch.videoId}`
    : `${import.meta.env.BASE_URL}404.html`;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, ml: `${DRAWER_WIDTH}px` }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            點擊節點可觀看比賽影片。若想找人討論比賽歡迎前往{' '}
            <a href={FORUM_URL} target="_blank" rel="noopener noreferrer">
              台灣桌球論壇
            </a>
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            國際桌總世界巡迴賽
          </Typography>
        </Toolbar>
        <Divider />
        <SimpleTreeView
          defaultExpandedItems={DEFAULT_EXPANDED}
          onItemClick={handleItemClick}
          slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
        >
          <TreeItem itemId="tours" label="歷年世界巡迴賽">
            {SEASONS.map((seasonEntry) => (
              <TreeItem
                key={seasonEntry.year}
                itemId={`season-${seasonEntry.year}`}
                label={String(seasonEntry.year)}
              >
                {[...seasonEntry.eventIds].reverse().map((id) => (
                  <TreeItem key={id} itemId={`event-${id}`} label={eventName(id)}>
                    {groupsOf(id).map((drawGroup) => (
                      <TreeItem
                        key={drawGroup}
                        itemId={drawItemId(id, drawGroup)}
                        label={DRAW_LABELS[drawGroup]}
                      />
                    ))}
                  </TreeItem>
                ))}
              </TreeItem>
            ))}
          </TreeItem>
        </SimpleTreeView>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
        <Toolbar />
        <Typography variant="h6" noWrap>
          {season} / {eventName(eventId)} / {GROUP_NAMES[group]}
        </Typography>

        <Card sx={{ maxWidth: 1050 }}>
          {bracket ? (
            <Tree
              data={bracket}
              nodeProps={NODE_PROPS}
              margins={TREE_MARGINS}
              gProps={{ onClick: handleNodeClick }}
              textProps={TEXT_PROPS}
              height={640}
              width={1000}
            />
          ) : (
            <Typography sx={{ p: 3 }}>ITTF 並未錄製這場比賽</Typography>
          )}
        </Card>
      </Box>

      <Dialog
        open={activeMatch !== null}
        onClose={closeDialog}
        maxWidth="xl"
        scroll="body"
        aria-labelledby="match-video-title"
      >
        <DialogTitle id="match-video-title">
          <Typography variant="h4" sx={{ textAlign: 'center' }}>
            {activeMatch?.name}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={closeDialog}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <iframe
            title="Youtube Video"
            height="720"
            width="1280"
            src={videoSrc}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
