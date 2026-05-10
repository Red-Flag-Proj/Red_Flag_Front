import type React from 'react';
import { Download, FileText, ShieldCheck, Table, TrendingUp, type LucideIcon } from 'lucide-react';
import { fdsService } from '../services/fdsService';
import { useFdsStore } from '../store/useFdsStore';

const ReportsPage: React.FC = () => {
  const { stats } = useFdsStore();

  return (
    <div className="fds-page-stack">
      <div className="fds-page-head">
        <div>
          <h2 className="fds-page-title">리포트</h2>
          <p className="fds-page-copy">탐지 결과와 조치 상태를 CSV 또는 PDF로 다운로드합니다.</p>
        </div>
        <span className="fds-btn fds-btn-ghost">데이터 기준: KST</span>
      </div>

      <div className="fds-grid-3">
        <SummaryCard icon={TrendingUp} label="분석 거래" value={stats.totalEvaluated.toLocaleString()} accent="#008a45" />
        <SummaryCard icon={ShieldCheck} label="처리 완료" value={stats.approvedCount.toLocaleString()} accent="#2563eb" />
        <SummaryCard icon={FileText} label="위험 거래" value={stats.highRiskCount.toLocaleString()} accent="#ef4444" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ReportCard
          icon={Table}
          title="CSV 리포트"
          description="거래 ID, 고객, 금액, 위험 점수, 위험 등급, 상태, 조치 결과를 표 형태로 저장합니다."
          buttonLabel="CSV 다운로드"
          onClick={() => fdsService.downloadReport('csv')}
          accent="#008a45"
        />
        <ReportCard
          icon={FileText}
          title="PDF 리포트"
          description="관리자 제출용 요약 리포트를 PDF로 생성합니다. 상위 위험 거래와 주요 위험 사유가 포함됩니다."
          buttonLabel="PDF 다운로드"
          onClick={() => fdsService.downloadReport('pdf')}
          accent="#2563eb"
        />
      </div>

      <div className="fds-card fds-card-pad">
        <div className="fds-row-between">
          <div>
            <h3 className="fds-panel-title">리포트 생성 상태</h3>
            <p className="fds-panel-subtitle">최근 집계 데이터와 감사 로그를 기준으로 다운로드 파일을 생성합니다.</p>
          </div>
          <span className="fds-badge fds-badge-normal">준비 완료</span>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent: string }) => (
  <div className="fds-card fds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
    <div className="fds-row-between">
      <p className="fds-stat-label">{label}</p>
      <div className="fds-stat-icon">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <h3 className="fds-stat-value">{value}</h3>
    <p className="fds-stat-delta">리포트 포함 대상</p>
    <div className="fds-sparkline" aria-hidden="true" />
  </div>
);

const ReportCard = ({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onClick,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  accent: string;
}) => (
  <div className="fds-card fds-card-pad" style={{ borderTop: `3px solid ${accent}` }}>
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${accent}18`, color: accent }}>
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="fds-panel-title">{title}</h3>
    <p className="fds-panel-subtitle min-h-16">{description}</p>
    <button onClick={onClick} className="fds-btn fds-btn-primary mt-6">
      <Download className="h-4 w-4" />
      {buttonLabel}
    </button>
  </div>
);

export default ReportsPage;
