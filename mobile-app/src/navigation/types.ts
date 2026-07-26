import type { NavigatorScreenParams } from "@react-navigation/native";

export type MemberFlowParamList = {
  MemberProfile: { userId: string };
  MemberAlbum: { albumId: string; ownerName?: string };
};

export type DiscoverStackParamList = MemberFlowParamList & {
  MemberSearch: undefined;
};

export type ChatStackParamList = {
  ChatInbox: undefined;
  ChatConversation: {
    threadId: string;
    recipientName?: string;
    recipientUserId?: string;
    recipientPhotoUrl?: string | null;
    recipientPhotoObjectKey?: string | null;
  };
} & MemberFlowParamList;

export type AlbumsStackParamList = {
  AlbumsList: undefined;
  AlbumDetail: { albumId: string };
};

export type ProfileStackParamList = {
  ProfileHub: { profileUpdated?: boolean } | undefined;
  EditTalentProfile: undefined;
  EditOrgProfile: undefined;
  AlbumsManage: undefined;
  AlbumDetail: { albumId: string };
};

export type AdminReportsStackParamList = {
  ReportsList: undefined;
} & MemberFlowParamList;

export type AdminUsersStackParamList = {
  UsersList: undefined;
} & MemberFlowParamList;

export type PostJobStackParamList = {
  PostJobHome: undefined;
  JobDetail: { jobId: string };
} & MemberFlowParamList;

export type AppTabParamList = {
  Home: undefined;
  Discover: NavigatorScreenParams<DiscoverStackParamList> | undefined;
  Jobs: undefined;
  Chat: NavigatorScreenParams<ChatStackParamList> | undefined;
  Albums: NavigatorScreenParams<AlbumsStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
  PostJob: NavigatorScreenParams<PostJobStackParamList> | undefined;
  Help: undefined;
  Reports: NavigatorScreenParams<AdminReportsStackParamList> | undefined;
  Users: NavigatorScreenParams<AdminUsersStackParamList> | undefined;
  Skills: undefined;
};
