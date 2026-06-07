import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { appointmentsApi, carriersApi, Appointment, Carrier, AppointmentStatus } from '../services/api';
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

const operationText: Record<string, string> = {
  load: '装货',
  unload: '卸货',
  both: '装卸',
};

const PendingZone: React.FC = () => {
  const [data, setData] = useState<Appointment[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aptList, carrierList] = await Promise.all([
        appointmentsApi.pending(),
        carriersApi.list(),
      ]);
      setData(aptList);
      setCarriers(carrierList);
    } catch (e: any) {
      message.error('加载数据失败：' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQueueCheck = async (record: Appointment) => {
    try {
      const result = await appointmentsApi.queueCheck(record.id);
      if (result.passed) {
        message.success(result.note);
      } else {
        message.warning(result.note);
      }
      fetchData();
    } catch (e: any) {
      message.error('校验失败：' + (e.response?.data?.message || e.message));
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await appointmentsApi.create(values);
      message.success('预约创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (e: any) {
      message.error('创建失败：' + (e.response?.data?.message || e.message));
    }
  };

  const columns: ColumnsType<Appointment> = [
    { title: '预约号', dataIndex: 'appointmentNo', width: 130 },
    {
      title: '承运商',
      dataIndex: ['carrier', 'name'],
      render: (_, r) => r.carrier?.name || '-',
    },
    { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
    { title: '司机', dataIndex: 'driverName', width: 100 },
    {
      title: '作业类型',
      dataIndex: 'operationType',
      width: 80,
      render: (v) => operationText[v] || v,
    },
    { title: '总件数', dataIndex: 'totalPackages', width: 80 },
    {
      title: '预约时间',
      dataIndex: 'scheduledTime',
      width: 160,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: AppointmentStatus) => <Tag color={v === 'pending' ? 'gold' : 'blue'}>{statusText[v]}</Tag>,
    },
    {
      title: '边界校验',
      width: 120,
      render: (_, r) =>
        r.boundaryCheckPassed ? (
          <Tag color="green">已通过</Tag>
        ) : (
          <Tooltip title={r.boundaryCheckNote || '未校验'}>
            <Tag color="default">未校验</Tag>
          </Tooltip>
        ),
    },
    {
      title: '操作',
      width: 180,
      render: (_, r) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleQueueCheck(r)}
          >
            排队校验
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="zone-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          承运商待办区 / 车辆排队
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建预约
        </Button>
      </div>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 1100 }}
      />
      <Modal
        title="新建装卸预约（承运商待办）"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="承运商" name="carrierId" rules={[{ required: true, message: '请选择承运商' }]}>
            <Select placeholder="选择承运商">
              {carriers.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="车牌号" name="plateNumber" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="如：京A12345" />
          </Form.Item>
          <Form.Item label="司机姓名" name="driverName" rules={[{ required: true, message: '请输入司机姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="司机电话" name="driverPhone" rules={[{ required: true, message: '请输入司机电话' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="作业类型" name="operationType" initialValue="unload">
            <Select>
              <Select.Option value="unload">卸货</Select.Option>
              <Select.Option value="load">装货</Select.Option>
              <Select.Option value="both">装卸</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="总件数" name="totalPackages" initialValue={0}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item label="月台号" name="dockNumber">
            <Input placeholder="如：A-01" />
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PendingZone;
