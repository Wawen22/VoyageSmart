'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { SendIcon, TrashIcon, ReplyIcon } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';

interface Comment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  parent_id: string | null;
  users: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface ActivityCommentsProps {
  activityId: string;
  tripId: string;
  isEditable?: boolean;
}

export default function ActivityComments({ activityId, tripId, isEditable = true }: ActivityCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('activity_comments')
          .select(`
            *,
            users:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('activity_id', activityId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Organize comments into a tree structure (top-level comments and replies)
        const topLevelComments: Comment[] = [];
        const replyComments: { [key: string]: Comment[] } = {};

        // First, separate top-level comments and replies
        data?.forEach((comment: Comment) => {
          if (comment.parent_id === null) {
            comment.replies = [];
            topLevelComments.push(comment);
          } else {
            if (!replyComments[comment.parent_id]) {
              replyComments[comment.parent_id] = [];
            }
            replyComments[comment.parent_id].push(comment);
          }
        });

        // Then, add replies to their parent comments
        topLevelComments.forEach(comment => {
          if (replyComments[comment.id]) {
            comment.replies = replyComments[comment.id];
          }
        });

        setComments(topLevelComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load comments. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (activityId) {
      fetchComments();
    }
  }, [activityId]);

  // Add a new comment
  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('activity_comments')
        .insert([
          {
            activity_id: activityId,
            user_id: user.id,
            content: newComment.trim(),
          },
        ])
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Add the new comment to the list
      setComments([...comments, { ...data, replies: [] }]);
      setNewComment('');

      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add a reply to a comment
  const handleAddReply = async () => {
    if (!user || !replyContent.trim() || !replyTo) return;

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('activity_comments')
        .insert([
          {
            activity_id: activityId,
            user_id: user.id,
            content: replyContent.trim(),
            parent_id: replyTo,
          },
        ])
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update the comments list with the new reply
      const updatedComments = comments.map(comment => {
        if (comment.id === replyTo) {
          return {
            ...comment,
            replies: [...(comment.replies || []), data],
          };
        }
        return comment;
      });

      setComments(updatedComments);
      setReplyTo(null);
      setReplyContent('');

      toast({
        title: 'Reply added',
        description: 'Your reply has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reply. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId: string, parentId: string | null) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activity_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // If it's a reply, update the parent comment
      if (parentId) {
        const updatedComments = comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: (comment.replies || []).filter(reply => reply.id !== commentId),
            };
          }
          return comment;
        });
        setComments(updatedComments);
      } else {
        // If it's a top-level comment, remove it from the list
        setComments(comments.filter(comment => comment.id !== commentId));
      }

      toast({
        title: 'Comment deleted',
        description: 'The comment has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Get the user's initials for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
        <div className="h-20 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Comments</h3>

      {/* Comment list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="space-y-4">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  {comment.users.avatar_url ? (
                    <AvatarImage src={comment.users.avatar_url} alt={comment.users.full_name} />
                  ) : (
                    <AvatarFallback>{getInitials(comment.users.full_name)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{comment.users.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatTimestamp(comment.created_at)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {isEditable && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setReplyTo(comment.id)}
                          >
                            <ReplyIcon className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs">Reply</span>
                          </Button>
                          {user?.id === comment.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteComment(comment.id, null)}
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>

              {/* Reply form */}
              {replyTo === comment.id && (
                <div className="ml-11 mt-2">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddReply}
                      disabled={!replyContent.trim() || submitting}
                    >
                      {submitting ? 'Sending...' : 'Reply'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 space-y-4 pt-2">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="flex space-x-3">
                      <Avatar className="h-7 w-7">
                        {reply.users.avatar_url ? (
                          <AvatarImage src={reply.users.avatar_url} alt={reply.users.full_name} />
                        ) : (
                          <AvatarFallback>{getInitials(reply.users.full_name)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">{reply.users.full_name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatTimestamp(reply.created_at)}
                            </span>
                          </div>
                          {isEditable && user?.id === reply.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteComment(reply.id, comment.id)}
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New comment form */}
      {isEditable && (
        <div className="pt-4">
          <Separator className="mb-4" />
          {user ? (
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.full_name || ''} />
                ) : (
                  <AvatarFallback>{user.full_name ? getInitials(user.full_name) : 'U'}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submitting}
                    className="flex items-center"
                  >
                    {submitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <LoginPrompt message="You need to sign in to add comments" />
          )}
        </div>
      )}
    </div>
  );
}
