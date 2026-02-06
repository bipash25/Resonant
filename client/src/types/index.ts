export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl?: string | null;
}

export type SourceType = 'LOCAL' | 'YOUTUBE' | 'SPOTIFY';

export interface Track {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number | null;
  coverUrl: string | null;
  sourceType: SourceType;
  sourceId: string | null;
  filePath: string | null;
  isLiked?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  userId: string;
  tracks?: PlaylistTrack[];
  _count?: { tracks: number };
}

export interface PlaylistTrack {
  id: string;
  position: number;
  track: Track;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SearchResults {
  local: Track[];
  youtube: Track[];
}
