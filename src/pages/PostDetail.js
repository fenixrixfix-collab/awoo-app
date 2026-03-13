import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pb, { getImageUrl } from '../services/pocketbase';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import '../styles/PostDetail.css';
import 'maplibre-gl/dist/maplibre-gl.css';
 
function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentPhoto, setCommentPhoto] = useState(null);
  const [commentPhotoPreview, setCommentPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, userName }
  const [showPhone, setShowPhone] = useState(false);
  const [postAuthor, setPostAuthor] = useState(null);
  const fileInputRef = useRef(null);
  const currentUser = pb.authStore.model;
 
  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
 
  const fetchPost = async () => {
    try {
      const record = await pb.collection('posts').getOne(id);
      setPost(record);
      if (record.userId) {
        try {
          const author = await pb.collection('users').getOne(record.userId);
          setPostAuthor(author);
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };
 
  const handleWriteMessage = () => {
    if (!post.userId || post.userId === currentUser?.id) return;
    const chatId = [currentUser.id, post.userId].sort().join('_');
    const chatName = post.userName || 'Пользователь';
    navigate(`/chat/${chatId}`, { state: { chatType: 'private', chatName, otherUserId: post.userId } });
  };
 
  const handleContactPhone = () => {
    if (!postAuthor) { alert('Загрузка данных...'); return; }
    if (postAuthor.phoneHidden) { alert('Пользователь скрыл номер телефона'); return; }
    if (!postAuthor.phone) { alert('Телефон не указан'); return; }
    setShowPhone(true);
  };
 
  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const records = await pb.collection('comments').getFullList({
        filter: `post = "${id}"`,
        sort: 'created',
        expand: 'user',
      });
