export interface BatchItem {
  id: string;
  title: string;
  thumbnail: string;
  batch_id?: string;
  batch_name?: string;
  batch_image?: string;
  category?: string;
}

export interface BatchesData {
  new: BatchItem[];
  old?: BatchItem[];
}

export interface SubjectItem {
  subjectid: string;
  subject_name: string;
  subject_logo?: string;
  sortingparam?: string | number;
  is_paid?: string;
}

export interface TopicItem {
  topicid: string;
  topic_name: string;
  topic_logo?: string;
  sortingparam?: string | number;
}

export interface QualityOption {
  quality: string;
  url: string;
  bitrate?: string;
  path?: string;
}

export interface MaterialItem {
  id: string;
  Title?: string;
  title?: string;
  material_type?: 'VIDEO' | 'PDF' | 'NOTES' | string;
  type?: string;
  thumbnail?: string;
  duration?: string;
  duration_in_secs?: string | number;
  date_and_time?: string;
  event_date?: string;
  file_link?: string;
  pdf_link?: string;
  pdf_link2?: string;
  download_link?: string;
  download_links?: QualityOption[];
  course_id?: string;
  live_status?: string | number;
  description?: string;
}

export interface VideoDetailsResponse {
  success: boolean;
  video_id: string;
  course_id: string;
  title: string;
  duration: string;
  thumbnail: string;
  date: string;
  video_player_token?: string;
  decoded_video_link?: string;
  player_url?: string;
  qualities?: QualityOption[];
  decoded_pdf_link?: string;
  pdf_viewer?: string;
  decoded_pdf_link2?: string;
  pdf_viewer2?: string;
  source?: string;
  error?: string;
}

export interface NavigationCrumb {
  type: 'root' | 'subject' | 'topic';
  id?: string;
  title: string;
}
