import React, { useEffect, useState } from 'react';
import { Table, Button, Input, DatePicker, Space, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { releasesApi, ReleaseRecord } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const ResultZone: React.FC = () => {
  const [data, setData] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);

  const fetchData = async (params?: any) => {
    setLoading(true);
    try {
      const query: any = {};
      if (params?.plateNumber) query.plateNumber = params.plateNumber;
      if (params?.carrierName) query.carrierName = params.carrierName;
      if (params?.startDate) query.startDate = params.startDate;
      if (params?.endDate) query.endDate = params.endDate;
      const list = await releasesApi.list(query);
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
    const params: any = {};
    if (plateNumber.trim()) params.plateNumber = plateNumber.trim();
    if (carrierName.trim()) params.carrierName = carrierName.trim();
    if (dateRange && dateRange.length === 2) {
      params.startDate = dateRange[0].startOf('day').toISOString();
      params.endDate = dateRange[1].endOf('day').toISOString();
    }
    fetchData(params);
  };

  const handleReset = () => {
    setPlateNumber('');
    setCarrierName('');
    setDateRange(null);
    fetchData();
  };

  const columns: ColumnsType<ReleaseRecord> = [
    { title: '放行单号', dataIndex: 'releaseNo', width: 130 },
    { title: '预约号', dataIndex: ['appointment', 'appointmentNo'], width: 130, render: (_, r) => r.appointment?.appointmentNo || '-' },
    { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
    { title: '承运商', dataIndex: 'carrierName', width: 180 },
    { title: '预报件数', dataIndex: 'totalPackages', width: 90 },
    { title: '装卸进度', dataIndex: 'handledPackages', width: 90 },
    {
      title: '实际件数',
      dataIndex: 'actualPackages',
      width: 140,
      render: (v: number, r) => {
        const total = r.totalPackages || 0;
        const actual = v || 0;
        const diff = total > 0 ? Math.abs(actual - total) / total : 0;
        return (
          <Space>
            <b>{actual}</b>
            {r.needsReview ? (
              <Tag color="orange">
                ⚠️ 差异 {(diff * 100).toFixed(1)}%，需复核
              </Tag>
            ) : diff > 0 ? (
              <Tag color="green">差异 {(diff * 100).toFixed(1)}%</Tag>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: '滞留罚金',
      dataIndex: 'detentionFee',
      width: 180,
      render: (v: number, r) => (
        <Space>
          {Number(v) > 0 ? (
            <Tag color="red" className="detention-tag">¥ {Number(v).toFixed(2)}</Tag>
          ) : (
            <span style={{ color: '#999' }}>无</span>
          )}
          {Number(v) > 0 &&
            (r.detentionPaid ? (
              <Tag color="green">✓ 已缴</Tag>
            ) : (
              <Tag color="orange">⚠️ 未缴</Tag>
            ))}
        </Space>
      ),
    },
    {
      title: '放行时间',
      dataIndex: 'releasedAt',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    { title: '放行人', dataIndex: 'releasedBy', width: 100, render: (v) => v || '-' },
    { title: '备注', dataIndex: 'remarks', ellipsis: true },
  ];

  return (
    <div className="zone-card">
      <div className="section-title">放行结果区（放行记录 + 筛选条件）</div>

      <div className="filter-row">
        <Space wrap>
          <Input
            placeholder="按车牌号筛选"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            style={{ width: 180 }}
            allowClear
            prefix={<span style={{ color: '#999' }}>车牌</span>}
          />
          <Input
            placeholder="按承运商筛选"
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<span style={{ color: '#999' }}>承运商</span>}
          />
          <RangePicker
            showTime
            value={dateRange}
            onChange={(v) => setDateRange(v)}
            placeholder={['开始日期', '结束日期']}
          />
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
        pagination={{ pageSize: 5, showSizeChanger: true, showTotal: (t) => `共 ${t} 条放行记录` }}
        scroll={{ x: 1500 }}
      />
    </div>
  );
};

export default ResultZone;
