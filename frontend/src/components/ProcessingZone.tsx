import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Space, Tag, Progress, Input, Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { appointmentsApi, releasesApi, Appointment, AppointmentStatus } from '../services/api';
import dayjs from 'dayjs';

const statusText: Record<AppointmentStatus, string> = {
  pending: '待办',
  queued: '排队中',
  arrived: '已到场',
  loading: '装卸中',
  completed: '已完成',
  released: '已放行',
  cancelled: '已取消',
};

const statusColor: Record<AppointmentStatus, string> = {
  pending: 'gold',
  queued: 'blue',
  arrived: 'cyan',
  loading: 'purple',
  completed: 'green',
  released: 'default',
  cancelled: 'red',
};

const ProcessingZone: React.FC = () => {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [packageModal, setPackageModal] = useState<{ open: boolean; record?: Appointment }>({ open: false });
  const [releaseModal, setReleaseModal] = useState<{ open: boolean; record?: Appointment }>({ open: false });
  const [detentionModal, setDetentionModal] = useState<{ open: boolean; record?: Appointment }>({ open: false });
  const [pkgForm] = Form.useForm();
  const [releaseForm] = Form.useForm();
  const [detentionForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await appointmentsApi.processing();
      setData(list);
    } catch (e: any) {
      message.error('加载处理区数据失败：' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (record: Appointment, status: AppointmentStatus) => {
    try {
      await appointmentsApi.update(record.id, { status });
      message.success(`状态已更新为：${statusText[status]}`);
      fetchData();
    } catch (e: any) {
      message.error('更新失败：' + (e.response?.data?.message || e.message));
    }
  };

  const handlePackages = async (values: any) => {
    if (!packageModal.record) return;
    try {
      await appointmentsApi.handlePackages(packageModal.record.id, values.packages);
      message.success('计件处理成功');
      setPackageModal({ open: false });
      pkgForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error('处理失败：' + (e.response?.data?.message || e.message));
    }
  };

  const handleDetention = async (values: any) => {
    if (!detentionModal.record) return;
    try {
      await appointmentsApi.update(detentionModal.record.id, { detentionFee: values.detentionFee });
      message.success('滞留罚金已更新');
      setDetentionModal({ open: false });
      detentionForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error('更新失败：' + (e.response?.data?.message || e.message));
    }
  };

  const handleRelease = async (values: any) => {
    if (!releaseModal.record) return;
    try {
      await releasesApi.create({
        appointmentId: releaseModal.record.id,
        detentionFee: values.detentionFee,
        releasedBy: values.releasedBy,
        remarks: values.remarks,
      });
      message.success('车辆已放行');
      setReleaseModal({ open: false });
      releaseForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error('放行失败：' + (e.response?.data?.message || e.message));
    }
  };

  const getNodeMenu = (record: Appointment): MenuProps['items'] => {
    const items: MenuProps['items'] = [];
    if (record.status === 'queued') {
      items.push({ key: 'arrived', label: '确认到场 → 已到场' });
    }
    if (record.status === 'arrived') {
      items.push({ key: 'loading', label: '开始装卸 → 装卸中' });
    }
    if (record.status === 'loading') {
      items.push({ key: 'completed', label: '装卸完成 → 已完成' });
    }
    return items;
  };

  const handleNodeClick = (key: string, record: Appointment) => {
    updateStatus(record, key as AppointmentStatus);
  };

  const columns: ColumnsType<Appointment> = [
    { title: '预约号', dataIndex: 'appointmentNo', width: 130, fixed: 'left' },
    {
      title: '承运商',
      dataIndex: ['carrier', 'name'],
      width: 160,
      render: (_, r) => r.carrier?.name || '-',
    },
    { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
    { title: '月台号', dataIndex: 'dockNumber', width: 90, render: (v) => v || '-' },
    {
      title: '装卸进度',
      width: 160,
      render: (_, r) => (
        <Progress
          percent={r.totalPackages > 0 ? Math.round((r.handledPackages / r.totalPackages) * 100) : 0}
          format={() => `${r.handledPackages} / ${r.totalPackages}`}
          size="small"
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: AppointmentStatus) => <Tag color={statusColor[v]}>{statusText[v]}</Tag>,
    },
    {
      title: '滞留罚金（处理区）',
      dataIndex: 'detentionFee',
      width: 140,
      render: (v: number, r) => (
        <Space>
          {Number(v) > 0 ? (
            <Tag color="red" className="detention-tag">
              ¥ {Number(v).toFixed(2)}
            </Tag>
          ) : (
            <span style={{ color: '#999' }}>无</span>
          )}
          <Button size="small" onClick={() => { detentionForm.setFieldsValue({ detentionFee: r.detentionFee || 0 }); setDetentionModal({ open: true, record: r }); }}>
            设置
          </Button>
        </Space>
      ),
    },
    {
      title: '节点时间',
      width: 200,
      render: (_, r) => (
        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
          {r.arrivedAt && <div>到场：{dayjs(r.arrivedAt).format('MM-DD HH:mm')}</div>}
          {r.startedAt && <div>开始：{dayjs(r.startedAt).format('MM-DD HH:mm')}</div>}
          {r.completedAt && <div>完成：{dayjs(r.completedAt).format('MM-DD HH:mm')}</div>}
        </div>
      ),
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      render: (_, r) => (
        <Space size={4} wrap>
          <Dropdown
            menu={{
              items: getNodeMenu(r),
              onClick: ({ key }) => handleNodeClick(key, r),
            }}
            disabled={getNodeMenu(r).length === 0}
          >
            <Button size="small" type="primary">
              更新节点
            </Button>
          </Dropdown>
          {r.status === 'loading' && (
            <Button size="small" onClick={() => { pkgForm.resetFields(); setPackageModal({ open: true, record: r }); }}>
              装卸计件
            </Button>
          )}
          {r.status === 'completed' && (
            <Button
              size="small"
              type="primary"
              danger
              onClick={() => {
                releaseForm.setFieldsValue({
                  detentionFee: r.detentionFee || 0,
                  releasedBy: '系统管理员',
                  remarks: r.remarks || '',
                });
                setReleaseModal({ open: true, record: r });
              }}
            >
              放行
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="zone-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          月台窗口处理区（滞留罚金在此区展示）
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          刷新
        </Button>
      </div>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 1300 }}
      />

      <Modal title="装卸计件" open={packageModal.open} onCancel={() => setPackageModal({ open: false })} onOk={() => pkgForm.submit()}>
        <p style={{ marginBottom: 16 }}>
          当前预约：{packageModal.record?.appointmentNo}（车牌号：{packageModal.record?.plateNumber}）
          <br />
          已处理：{packageModal.record?.handledPackages || 0} / 总件数：{packageModal.record?.totalPackages || 0}
        </p>
        <Form form={pkgForm} layout="vertical" onFinish={handlePackages}>
          <Form.Item label="本次处理件数" name="packages" rules={[{ required: true, message: '请输入件数' }]}>
            <InputNumber min={1} max={(packageModal.record?.totalPackages || 0) - (packageModal.record?.handledPackages || 0)} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="设置滞留罚金" open={detentionModal.open} onCancel={() => setDetentionModal({ open: false })} onOk={() => detentionForm.submit()}>
        <Form form={detentionForm} layout="vertical" onFinish={handleDetention}>
          <Form.Item label="滞留罚金金额（元）" name="detentionFee" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0} step={10} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="车辆放行确认" open={releaseModal.open} onCancel={() => setReleaseModal({ open: false })} onOk={() => releaseForm.submit()}>
        <Form form={releaseForm} layout="vertical" onFinish={handleRelease}>
          <Form.Item label="滞留罚金（元）" name="detentionFee">
            <InputNumber min={0} step={10} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="放行人" name="releasedBy" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="放行备注" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProcessingZone;
