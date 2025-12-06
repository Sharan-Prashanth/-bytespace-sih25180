'use client';;
import { createPlatePlugin } from 'platejs/react';

import { BlockDiscussion } from '@/components/ui (plate files)/block-discussion';

const discussionsData = [
  {
    id: 'discussion1',
    comments: [
      {
        id: 'comment1',
        contentRich: [
          {
            children: [
              {
                text: 'Comments are a great way to provide feedback and discuss changes.',
              },
            ],
            type: 'p',
          },
        ],
        createdAt: new Date(Date.now() - 600_000),
        discussionId: 'discussion1',
        isEdited: false,
        userId: 'charlie',
      },
      {
        id: 'comment2',
        contentRich: [
          {
            children: [
              {
                text: 'Agreed! The link to the docs makes it easy to learn more.',
              },
            ],
            type: 'p',
          },
        ],
        createdAt: new Date(Date.now() - 500_000),
        discussionId: 'discussion1',
        isEdited: false,
        userId: 'bob',
      },
    ],
    createdAt: new Date(),
    documentContent: 'comments',
    isResolved: false,
    userId: 'charlie',
  },
  {
    id: 'discussion2',
    comments: [
      {
        id: 'comment1',
        contentRich: [
          {
            children: [
              {
                text: 'Nice demonstration of overlapping annotations with both comments and suggestions!',
              },
            ],
            type: 'p',
          },
        ],
        createdAt: new Date(Date.now() - 300_000),
        discussionId: 'discussion2',
        isEdited: false,
        userId: 'bob',
      },
      {
        id: 'comment2',
        contentRich: [
          {
            children: [
              {
                text: 'This helps users understand how powerful the editor can be.',
              },
            ],
            type: 'p',
          },
        ],
        createdAt: new Date(Date.now() - 200_000),
        discussionId: 'discussion2',
        isEdited: false,
        userId: 'charlie',
      },
    ],
    createdAt: new Date(),
    documentContent: 'overlapping',
    isResolved: false,
    userId: 'bob',
  },
];

export const avatarUrl = (seed) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;

/**
 * Create users data from current user, collaborators, and discussion comments
 * This function should be called with actual user data
 */
export function createUsersData(currentUser, collaborators = [], discussions = []) {
  const users = {};
  
  // Add current user
  if (currentUser) {
    users[currentUser._id] = {
      id: currentUser._id,
      avatarUrl: avatarUrl(currentUser.email || currentUser._id),
      name: currentUser.fullName || currentUser.name || 'Anonymous',
    };
  }
  
  // Add collaborators
  collaborators.forEach(collab => {
    if (collab && collab._id) {
      users[collab._id] = {
        id: collab._id,
        avatarUrl: avatarUrl(collab.email || collab._id),
        name: collab.fullName || collab.name || 'Anonymous',
      };
    }
  });
  
  // Add users from discussions (from database)
  discussions.forEach(discussion => {
    if (discussion.comments) {
      discussion.comments.forEach(comment => {
        if (comment.user && !users[comment.user.id]) {
          users[comment.user.id] = {
            id: comment.user.id,
            avatarUrl: comment.user.avatarUrl || avatarUrl(comment.user.id),
            name: comment.user.name || 'Unknown User',
          };
        }
        // Add reply users as well
        if (comment.replies) {
          comment.replies.forEach(reply => {
            if (reply.user && !users[reply.user.id]) {
              users[reply.user.id] = {
                id: reply.user.id,
                avatarUrl: reply.user.avatarUrl || avatarUrl(reply.user.id),
                name: reply.user.name || 'Unknown User',
              };
            }
          });
        }
      });
    }
  });
  
  return users;
}

// This plugin is purely UI. It's only used to store the discussions and users data
// Initialize with empty data - will be configured by editor component
export const discussionPlugin = createPlatePlugin({
  key: 'discussion',
  options: {
    currentUserId: null,
    discussions: [], // Start with empty array - will be loaded from backend
    users: {},
  },
})
  .configure({
    render: { aboveNodes: BlockDiscussion },
  })
  .extendSelectors(({ getOption }) => ({
    currentUser: () => {
      const currentUserId = getOption('currentUserId');
      const users = getOption('users');
      return users[currentUserId] || null;
    },
    user: (id) => {
      const users = getOption('users');
      return users[id] || {
        id: id,
        avatarUrl: avatarUrl(id),
        name: 'Unknown User',
      };
    },
  }));

export const DiscussionKit = [discussionPlugin];
