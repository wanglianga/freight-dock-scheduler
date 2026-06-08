import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  DatePicker,
  Space,
  Tag,
  message,
  Modal,
  Descriptions,
  Divider,
  Statistic,
  Row,
  Col,
  Select,
  InputNumber,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  releasesApi,
  ReleaseRecord,
  ReleaseFilterParams,
  AcceptanceConclusion,
  Appointment,
} from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const conclusionText: Record<AcceptanceConclusion, string> = {
  passed: '验收通过',
  needs_review: '需复核',
  rejected: '拒收',
};

const conclusionColor: Record<AcceptanceConclusion, string> = {
  passed: 'green',
  needs_review: 'orange',
  rejected: 'red',
};

const calcStayDuration = (arrived?: string, completed?: string): number => {
  if (!arrived || !completed) return 0;
  return Math.round(dayjs(completed).diff(dayjs(arrived), 'minute'));
};

const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
};

const ResultZone: React.FC = () => {
  const [data, setData] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [plateNumber, setPlateNumber] = useState('');
  const [dockNumber, setDockNumber] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [minFee, setMinFee] = useState<number | null>(null);
  const [maxFee, setMaxFee] = useState<number | null>(null);
  const [acceptance, setAcceptance] = useState<AcceptanceConclusion | undefined>(undefined);

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    record?: ReleaseRecord;
    loading: boolean;
  }>({ open: false, loading: false });

  const buildParams = (): ReleaseFilterParams => {
    const params: ReleaseFilterParams = {};
    if (plateNumber.trim()) params.plateNumber = plateNumber.trim();
    if (dockNumber.trim()) params.dockNumber = dockNumber.trim();
    if (dateRange && dateRange.length === 2) {
      params.startDate = dateRange[0].startOf('day').toISOString();
      params.endDate = dateRange[1].endOf('day').toISOString();
    }
    if (minFee !== null && minFee !== undefined) params.minDetentionFee = minFee;
    if (maxFee !== null && maxFee !== undefined) params.maxDetentionFee = maxFee;
    if (acceptance) params.acceptanceConclusion = acceptance;
    return params;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const list = await releasesApi.list(params);
      setData(list);
    } catch (e: any) {
      message.error('加载放行记录失败：' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData();
  };

  const handleReset = () => {
    setPlateNumber('');
    setDockNumber('');
    setDateRange(null);
    setMinFee(null);
    setMaxFee(null);
    setAcceptance(undefined);
    setTimeout(fetchData, 0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = buildParams();
      const blob = await releasesApi.export(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = dayjs().format('YYYY-MM-DD');
      a.download = `release-records-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (e: any) {
      message.error('导出失败：' + (e.message || e));
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetail = async (record: ReleaseRecord) => {
    setDetailModal({ open: true, record, loading: true });
    try {
      const detail = await releasesApi.detail(record.id);
      setDetailModal({ open: true, record: detail, loading: false });
    } catch (e: any) {
      message.error('加载详情失败：' + (e.message || e));
      setDetailModal({ open: true, record, loading: false });
    }
  };

  const columns: ColumnsType<ReleaseRecord> = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      width: 110,
      fixed: 'left',
      render: (v: string) => <b>{v}</b>,
    },
    {
      title: '月台号',
      dataIndex: 'dockNumber',
      width: 90,
      render: (v: string) => v || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: '入场时间',
      dataIndex: 'arrivedAt',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '作业开始时间',
      dataIndex: 'startedAt',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '作业结束时间',
      dataIndex: 'completedAt',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '停留总时长',
      width: 110,
      render: (_, r) => formatDuration(calcStayDuration(r.arrivedAt, r.completedAt)),
    },
    {
      title: '罚金金额',
      dataIndex: 'detentionFee',
      width: 110,
      render: (v: number) =>
        Number(v) > 0 ? (
          <Tag color="red">¥{Number(v).toFixed(2)}</Tag>
        ) : (
          <span style={{ color: '#999' }}>无</span>
        ),
    },
    {
      title: '装卸件数',
      width: 160,
      render: (_, r) => {
        const total = r.totalPackages || 0;
        const actual = r.actualPackages || 0;
        const handled = r.handledPackages || 0;
        const diff = total > 0 ? Math.abs(actual - total) / total : 0;
        return (
          <div>
            <div>
              预报：{total} &nbsp;|&nbsp; 实际：<b>{actual}</b> &nbsp;|&nbsp; 进度：{handled}
            </div>
            {actual > 0 && diff > 0 && (
              <Tag color={diff > 0.1 ? 'orange' : 'green'} style={{ marginTop: 4 }}>
                差异 {(diff * 100).toFixed(1)}%
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '验收结论',
      dataIndex: 'acceptanceConclusion',
      width: 110,
      render: (v: AcceptanceConclusion) => (
        <Tag color={conclusionColor[v] || 'default'}>
          {conclusionText[v] || v}
        </Tag>
      ),
    },
    {
      title: '放行操作人',
      dataIndex: 'releasedBy',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '放行时间',
      dataIndex: 'releasedAt',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => handleViewDetail(r)}
          >
            ℹ️ 详情
          </Button>
        </Space>
      ),
    },
  ];

  const apt: Appointment | undefined = detailModal.record?.appointment;
  const stayMin = calcStayDuration(detailModal.record?.arrivedAt, detailModal.record?.completedAt);

  return (
    <div className="zone-card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div className="section-title" style={{ marginBottom: 0 }}>
          放行结果区（完整生命周期追踪 + 多维度筛选）
        </div>
        <Space>
          <Tag color="blue">车牌模糊匹配</Tag>
          <Tag color="cyan">月台精确筛选</Tag>
          <Tag color="purple">日期范围</Tag>
          <Tag color="orange">罚金区间</Tag>
          <Tag color="green">验收结论</Tag>
          <Button onClick={handleExport} loading={exporting}>
            ⬇️ 导出 CSV
          </Button>
        </Space>
      </div>

      <div className="filter-row" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="车牌号（模糊匹配）"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            style={{ width: 180 }}
            allowClear
            prefix={<span style={{ color: '#999' }}>车牌</span>}
          />
          <Input
            placeholder="月台号（精确匹配）"
            value={dockNumber}
            onChange={(e) => setDockNumber(e.target.value)}
            style={{ width: 160 }}
            allowClear
            prefix={<span style={{ color: '#999' }}>月台</span>}
          />
          <RangePicker
            showTime
            value={dateRange}
            onChange={(v) => setDateRange(v)}
            placeholder={['开始日期', '结束日期']}
          />
          <Space.Compact>
            <InputNumber
              placeholder="最小罚金"
              min={0}
              value={minFee}
              onChange={(v) => setMinFee(v as number | null)}
              style={{ width: 120 }}
              addonBefore="¥"
              addonAfter="≤ 罚金"
            />
            <InputNumber
              placeholder="最大罚金"
              min={0}
              value={maxFee}
              onChange={(v) => setMaxFee(v as number | null)}
              style={{ width: 120 }}
              addonBefore="≤ ¥"
            />
          </Space.Compact>
          <Select
            placeholder="验收结论"
            value={acceptance}
            onChange={(v) => setAcceptance(v)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="passed">验收通过</Option>
            <Option value="needs_review">需复核</Option>
            <Option value="rejected">拒收</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            筛选
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条放行记录`,
        }}
        scroll={{ x: 1900 }}
      />

      <Modal
        title="放行记录详情（完整生命周期追溯）"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, loading: false })}
        width={860}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ open: false, loading: false })}>
            关闭
          </Button>,
        ]}
      >
        {detailModal.loading && <p style={{ textAlign: 'center', padding: 40 }}>加载中...</p>}
        {!detailModal.loading && detailModal.record && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Statistic
                  title="放行单号"
                  value={detailModal.record.releaseNo}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="车牌号"
                  value={detailModal.record.plateNumber}
                  valueStyle={{ fontSize: 16, color: '#1677ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="月台号"
                  value={detailModal.record.dockNumber || '-'}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
            </Row>

            <Divider orientation="left">时间节点追踪</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="入场时间"
                  value={
                    detailModal.record.arrivedAt
                      ? dayjs(detailModal.record.arrivedAt).format('MM-DD HH:mm')
                      : '-'
                  }
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="作业开始"
                  value={
                    detailModal.record.startedAt
                      ? dayjs(detailModal.record.startedAt).format('MM-DD HH:mm')
                      : '-'
                  }
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="作业结束"
                  value={
                    detailModal.record.completedAt
                      ? dayjs(detailModal.record.completedAt).format('MM-DD HH:mm')
                      : '-'
                  }
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="放行时间"
                  value={
                    detailModal.record.releasedAt
                      ? dayjs(detailModal.record.releasedAt).format('MM-DD HH:mm')
                      : '-'
                  }
                  valueStyle={{ fontSize: 14, color: '#389e0d' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={8}>
                <Statistic
                  title="园区停留总时长"
                  value={formatDuration(stayMin)}
                  valueStyle={{ fontSize: 16, color: stayMin > 120 ? '#f5222d' : '#1677ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="装卸作业时长"
                  value={formatDuration(
                    calcStayDuration(detailModal.record.startedAt, detailModal.record.completedAt),
                  )}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="放行操作人"
                  value={detailModal.record.releasedBy || '-'}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
            </Row>

            <Divider orientation="left">装卸与验收</Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="预报件数">{detailModal.record.totalPackages}</Descriptions.Item>
              <Descriptions.Item label="实际装卸件数">
                <b>{detailModal.record.actualPackages}</b>
              </Descriptions.Item>
              <Descriptions.Item label="装卸进度">{detailModal.record.handledPackages}</Descriptions.Item>
              <Descriptions.Item label="差异率">
                {detailModal.record.totalPackages > 0 ? (
                  <>
                    {(
                      (Math.abs(
                        detailModal.record.actualPackages - detailModal.record.totalPackages,
                      ) /
                        detailModal.record.totalPackages) *
                      100
                    ).toFixed(2)}
                    %
                  </>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="验收结论" span={2}>
                <Tag color={conclusionColor[detailModal.record.acceptanceConclusion] || 'default'}>
                  {conclusionText[detailModal.record.acceptanceConclusion] ||
                    detailModal.record.acceptanceConclusion}
                </Tag>
                {detailModal.record.needsReview && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>
                    ⚠️ 需复核
                  </Tag>
                )}
              </Descriptions.Item>
              {detailModal.record.reviewNote && (
                <Descriptions.Item label="复核备注" span={2}>
                  {detailModal.record.reviewNote}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">罚金处理</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="罚金金额"
                  value={Number(detailModal.record.detentionFee).toFixed(2)}
                  prefix="¥"
                  valueStyle={{
                    color: Number(detailModal.record.detentionFee) > 0 ? '#f5222d' : '#389e0d',
                    fontSize: 20,
                  }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="缴纳状态"
                  value={detailModal.record.detentionPaid ? '已缴纳' : '未缴纳'}
                  valueStyle={{
                    color: detailModal.record.detentionPaid ? '#389e0d' : '#f5222d',
                    fontSize: 18,
                  }}
                />
              </Col>
            </Row>

            {detailModal.record.remarks && (
              <>
                <Divider orientation="left">备注</Divider>
                <p style={{ color: '#666', lineHeight: 1.6 }}>{detailModal.record.remarks}</p>
              </>
            )}

            {apt && (
              <>
                <Divider orientation="left">关联预约信息</Divider>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="预约号">{apt.appointmentNo}</Descriptions.Item>
                  <Descriptions.Item label="承运商">{detailModal.record.carrierName}</Descriptions.Item>
                  <Descriptions.Item label="司机">{apt.driverName}</Descriptions.Item>
                  <Descriptions.Item label="司机电话">{apt.driverPhone}</Descriptions.Item>
                  <Descriptions.Item label="作业类型">
                    {apt.operationType === 'load'
                      ? '装货'
                      : apt.operationType === 'unload'
                      ? '卸货'
                      : '装卸'}
                  </Descriptions.Item>
                  <Descriptions.Item label="预约状态">{apt.status}</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResultZone;
