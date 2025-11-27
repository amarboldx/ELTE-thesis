import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Pdf from 'react-native-pdf';
import api from './config/api';

const Receipt = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // detail modal state
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailItemsMap, setDetailItemsMap] = useState({});
  const [detailStaffName, setDetailStaffName] = useState(null);

  // pdf modal state
  const [pdfVisible, setPdfVisible] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/receipts');
      const data = res.data ?? [];
      console.log('Receipts from API:', data);
      setReceipts(data);
    } catch (err) {
      const status = err?.response?.status;
      const url = err?.config?.url;
      console.log('Failed to load receipts', { status, url, data: err?.response?.data });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPdfUrl = (receiptId) => {
    const base = api.defaults.baseURL?.replace(/\/+$/, '') || '';
    console.log('Base URL for PDF:', base);
    return `${base}/receipts/${receiptId}/pdf`;
  };

  const handleOpenDetails = (receipt) => {
    setSelectedReceipt(receipt);
    setDetailVisible(true);
    loadReceiptDetails(receipt);
  };

  const loadReceiptDetails = async (receipt) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setDetailOrder(null);
      setDetailItemsMap({});
      setDetailStaffName(null);

      // 1) Load order by orderId
      const orderRes = await api.get(`/order/${receipt.orderId}`);
      const order = orderRes.data;
      setDetailOrder(order);

      // 2) Load items by IDs (from order.itemIds)
      const itemIds = order.itemIds || [];
      if (itemIds.length > 0) {
        const itemsRes = await api.post('/menu/list-id', itemIds);
        const map = {};
        (itemsRes.data || []).forEach((i) => {
          map[i.id] = i; // expect {id, name, price, ...}
        });
        setDetailItemsMap(map);
      }

      // 3) Load staff info
      if (order.staffId) {
        const staffRes = await api.get(`/staff/${order.staffId}`);
        const staff = staffRes.data || {};
        const name =
          staff.name ||
          staff.username ||
          staff.userName ||
          `Staff #${order.staffId}`;
        setDetailStaffName(name);
      }
    } catch (err) {
      console.log(
        'Failed to load receipt details',
        err?.response?.status,
        err?.config?.url,
      );
      setDetailError('Failed to load details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const renderReceipt = ({ item }) => {
    const subtotal = item.totalAmount ?? 0;
    const tip = item.tipAmount ?? 0;
    const total = item.finalAmount ?? subtotal + tip;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOpenDetails(item)}
        activeOpacity={0.8}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.header}>Receipt #{item.id}</Text>
          <MaterialCommunityIcons name="file-pdf-box" size={26} color="#d32f2f" />
        </View>

        <Text style={styles.sub}>Order ID: {item.orderId}</Text>
        <Text style={styles.sub}>
          Issued:{' '}
          {item.issuedAt ? new Date(item.issuedAt).toLocaleString() : 'Unknown'}
        </Text>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <Text>Subtotal:</Text>
          <Text>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text>Tip:</Text>
          <Text>${tip.toFixed(2)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.bold}>Total:</Text>
          <Text style={styles.bold}>${total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedReceipt) return null;

    const subtotal = selectedReceipt.totalAmount ?? 0;
    const tip = selectedReceipt.tipAmount ?? 0;
    const total = selectedReceipt.finalAmount ?? subtotal + tip;

    // group items like in the PDF
    let groupedItems = [];
    if (detailOrder?.itemIds && Array.isArray(detailOrder.itemIds)) {
      const counts = {};
      detailOrder.itemIds.forEach((id) => {
        if (!counts[id]) counts[id] = 0;
        counts[id] += 1;
      });
      groupedItems = Object.entries(counts).map(([id, count]) => {
        const raw = detailItemsMap[id] || {};
        const name = raw.name || `Item #${id}`;
        const price = raw.price ?? 0;
        return {
          id,
          name,
          count,
          unitPrice: price,
          lineTotal: price * count,
        };
      });
    }

    const tableLabel = detailOrder?.tableDataId
      ? `Table : ${detailOrder.tableDataId}`
      : 'Table : -';

    return (
      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>SMART RESTAURANT</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.modalSubtitle}>RECEIPT</Text>
              <Text style={styles.modalLine}>Receipt ID: {selectedReceipt.id}</Text>
              <Text style={styles.modalLine}>Order ID : {selectedReceipt.orderId}</Text>
              <Text style={styles.modalLine}>{tableLabel}</Text>
              <Text style={styles.modalLine}>
                Issued at :{' '}
                {selectedReceipt.issuedAt
                  ? new Date(selectedReceipt.issuedAt).toLocaleString()
                  : '-'}
              </Text>
              <Text style={styles.modalLine}>
                Waiter : {detailStaffName || 'Loading...'}
              </Text>

              <Text style={styles.modalSeparator}>--------------------------------</Text>
              {detailLoading && (
                <View style={{ alignItems: 'center', marginVertical: 8 }}>
                  <ActivityIndicator size="small" />
                  <Text style={{ fontSize: 12 }}>Loading order details…</Text>
                </View>
              )}
              {detailError && (
                <Text style={{ color: 'red', marginBottom: 8 }}>{detailError}</Text>
              )}

              {groupedItems.length > 0 && (
                <>
                  <Text style={[styles.modalLine, styles.modalItemsHeader]}>
                    Items
                  </Text>
                  {groupedItems.map((i) => (
                    <View key={i.id} style={styles.modalItemRow}>
                      <Text style={{ flex: 1 }}>
                        {i.count}× {i.name}
                      </Text>
                      <Text>${i.lineTotal.toFixed(2)}</Text>
                    </View>
                  ))}
                </>
              )}

              <Text style={styles.modalSeparator}>--------------------------------</Text>
              <Text style={styles.modalLine}>Subtotal : {subtotal.toFixed(2)}</Text>
              <Text style={styles.modalLine}>Tip : {tip.toFixed(2)}</Text>
              <Text style={styles.modalLine}>Total : {total.toFixed(2)}</Text>
              <Text style={styles.modalSeparator}>--------------------------------</Text>
              <Text style={styles.modalFooterText}>Thank you for your visit!</Text>
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalPdfButton}
                onPress={() => setPdfVisible(true)}
              >
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.modalPdfButtonText}>View PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

    const renderPdfModal = () => {
    if (!selectedReceipt) return null;

    const url = getPdfUrl(selectedReceipt.id);
    const authHeader = api.defaults.headers.common?.Authorization;

    return (
        <Modal
        visible={pdfVisible}
        animationType="slide"
        onRequestClose={() => setPdfVisible(false)}
        >
        <View style={styles.pdfContainer}>
            <View style={styles.pdfHeader}>
            <TouchableOpacity onPress={() => setPdfVisible(false)}>
                <MaterialCommunityIcons name="arrow-left" size={24} />
            </TouchableOpacity>
            <Text style={styles.pdfTitle}>Receipt #{selectedReceipt.id}</Text>
            </View>

            <Pdf
            source={{
                uri: url,
                cache: true,
                headers: authHeader
                ? { Authorization: authHeader }
                : {},
            }}
            trustAllCerts={false}
            onError={error => {
                console.log('PDF load error', error);
            }}
            style={styles.pdf}
            />
        </View>
        </Modal>
    );
    };


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Loading receipts…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenHeader}>Receipts</Text>
      <FlatList
        data={receipts}
        keyExtractor={(r) => r.id.toString()}
        renderItem={renderReceipt}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadReceipts();
            }}
            colors={['#6200ee']}
          />
        }
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            No receipts found.
          </Text>
        }
      />

      {renderDetailModal()}
      {renderPdfModal()}
    </View>
  );
};

export default Receipt;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f4f4f4',
  },
  screenHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 14,
    elevation: 3,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sub: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  bold: {
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalLine: {
    fontSize: 13,
    marginVertical: 1,
  },
  modalSeparator: {
    textAlign: 'center',
    marginVertical: 6,
    fontSize: 12,
  },
  modalFooterText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
  modalItemsHeader: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalPdfButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },

  // pdf modal
  pdfContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  pdfTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pdf: {
    flex: 1,
  },
});
