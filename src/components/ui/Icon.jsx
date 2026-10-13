import {
  FilePlus2, GitCompareArrows, Send, Eye, MessageCircleQuestion, MessageCircleReply, CircleCheck, CircleX, Ambulance, BadgeCheck, Ban, TriangleAlert,
  Clock3, Minus, Info, X, Search, Bell, Menu, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, LayoutDashboard, FileText, Network, Gauge,
  MessageSquare, BarChart3, Bot, ShieldCheck, LifeBuoy, LogOut, User, Building2, Activity, Printer, Download, RefreshCw, Plus, ArrowRight, ArrowUpDown,
  ArrowUp, ArrowDown, HeartPulse, Stethoscope, BedDouble, Wind, Droplets, Wrench, Siren, MapPin, Phone, Mail, Clock, Check, CircleHelp, Filter, List,
  LayoutGrid, Sparkles, Lock, Server, Users, ScrollText, Settings, Accessibility, Type, Contrast, Play, Edit3, Save, Hospital, TestTube, Syringe,
  Timer, Radio, Route, ClipboardCheck, History, ExternalLink, AlertCircle, CheckCircle2, XCircle, Inbox, SearchX, WifiOff, Command, CornerDownLeft, Zap,
} from 'lucide-react';

const MAP = {
  FilePlus2, GitCompareArrows, Send, Eye, MessageCircleQuestion, MessageCircleReply, CircleCheck, CircleX, Ambulance, BadgeCheck, Ban, TriangleAlert,
  Clock3, Minus, Info, X, Search, Bell, Menu, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, LayoutDashboard, FileText, Network, Gauge,
  MessageSquare, BarChart3, Bot, ShieldCheck, LifeBuoy, LogOut, User, Building2, Activity, Printer, Download, RefreshCw, Plus, ArrowRight, ArrowUpDown,
  ArrowUp, ArrowDown, HeartPulse, Stethoscope, BedDouble, Wind, Droplets, Wrench, Siren, MapPin, Phone, Mail, Clock, Check, CircleHelp, Filter, List,
  LayoutGrid, Sparkles, Lock, Server, Users, ScrollText, Settings, Accessibility, Type, Contrast, Play, Edit3, Save, Hospital, TestTube, Syringe,
  Timer, Radio, Route, ClipboardCheck, History, ExternalLink, AlertCircle, CheckCircle2, XCircle, Inbox, SearchX, WifiOff, Command, CornerDownLeft, Zap,
};

export default function Icon({ name, size = 16, ...rest }) {
  const C = MAP[name] || Info;
  return <C size={size} aria-hidden="true" focusable="false" {...rest} />;
}
