import 'package:flutter/material.dart';
import 'dart:js' as js;
import 'dart:ui_web' as ui_web;
import 'dart:html' as html;

void main() {
  runApp(const TenamVisionApp());
}

class TenamVisionApp extends StatelessWidget {
  const TenamVisionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Visión Artificial — TENAM',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0077B6),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      home: const HomeScreen(),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME — TabBar con los dos módulos
// ─────────────────────────────────────────────────────────────────────────────
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _currentTab = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        // Detener módulo anterior
        if (_tabController.previousIndex == 0) {
          js.context.callMethod('stopFaceDetection', []);
        } else if (_tabController.previousIndex == 1) {
          js.context.callMethod('stopYoloDetection', []);
        }
        setState(() => _currentTab = _tabController.index);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF060D1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D1B2A),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF0077B6).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF0096C7), width: 1),
              ),
              child: const Icon(Icons.remove_red_eye, color: Color(0xFF48CAE4), size: 20),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Visión Artificial',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFCAF0F8),
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  'Actividad Integradora 2 — TENAM',
                  style: TextStyle(
                    fontSize: 11,
                    color: Color(0xFF90E0EF),
                    fontFamily: 'Roboto Mono',
                  ),
                ),
              ],
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Container(
            color: const Color(0xFF0D1B2A),
            child: TabBar(
              controller: _tabController,
              indicatorColor: const Color(0xFF00B4D8),
              indicatorWeight: 3,
              labelColor: const Color(0xFF48CAE4),
              unselectedLabelColor: const Color(0xFF5E8EA4),
              labelStyle: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                fontFamily: 'Roboto Mono',
              ),
              tabs: const [
                Tab(
                  icon: Icon(Icons.camera, size: 18),
                  text: 'Módulo 1 — ESP32-CAM Sim',
                ),
                Tab(
                  icon: Icon(Icons.center_focus_strong, size: 18),
                  text: 'Módulo 2 — YOLO Live',
                ),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          FaceDetectionScreen(),
          YoloScreen(),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 1 — Simulación ESP32-CAM + Face Detection (Santos & Santos, Unit 5.2)
// ─────────────────────────────────────────────────────────────────────────────
class FaceDetectionScreen extends StatefulWidget {
  const FaceDetectionScreen({super.key});

  @override
  State<FaceDetectionScreen> createState() => _FaceDetectionScreenState();
}

class _FaceDetectionScreenState extends State<FaceDetectionScreen> {
  bool _started = false;
  final String _containerId = 'face-container-div';

  @override
  void initState() {
    super.initState();
    ui_web.platformViewRegistry.registerViewFactory(
      'face-container',
      (int viewId) {
        return html.DivElement()
          ..id = _containerId
          ..style.width = '100%'
          ..style.height = '100%'
          ..style.backgroundColor = '#0a0a1a';
      },
    );
  }

  void _startDetection() {
    setState(() => _started = true);
    Future.delayed(const Duration(milliseconds: 500), () {
      js.context.callMethod('startFaceDetection', [_containerId]);
    });
  }

  @override
  Widget build(BuildContext context) {
    return _buildLayout(
      moduleTitle: 'Tarea 1 — Detección de Rostros',
      moduleSubtitle: 'Basado en: Santos & Santos (2023) — Unit 5.2: Face Recognition con face-api.js\nWebcam del PC simula el stream de video de la ESP32-CAM vía Wi-Fi',
      icon: Icons.face,
      accentColor: const Color(0xFF00B4D8),
      buttonLabel: 'Iniciar ESP32-CAM Sim + Face-API',
      buttonIcon: Icons.camera_alt,
      containerId: 'face-container',
      started: _started,
      onStart: _startDetection,
      infoChips: const [
        _InfoChip(label: 'face-api.js v0.22.2', icon: Icons.psychology),
        _InfoChip(label: 'TinyFaceDetector', icon: Icons.face_retouching_natural),
        _InfoChip(label: 'Expresiones Faciales', icon: Icons.emoji_emotions),
        _InfoChip(label: 'Landmarks 68pts', icon: Icons.scatter_plot),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 2 — YOLO Object Detection
// ─────────────────────────────────────────────────────────────────────────────
class YoloScreen extends StatefulWidget {
  const YoloScreen({super.key});

  @override
  State<YoloScreen> createState() => _YoloScreenState();
}

class _YoloScreenState extends State<YoloScreen> {
  bool _started = false;
  final String _containerId = 'yolo-container-div';

  @override
  void initState() {
    super.initState();
    ui_web.platformViewRegistry.registerViewFactory(
      'yolo-container',
      (int viewId) {
        return html.DivElement()
          ..id = _containerId
          ..style.width = '100%'
          ..style.height = '100%'
          ..style.backgroundColor = 'black';
      },
    );
  }

  void _startDetection() {
    setState(() => _started = true);
    Future.delayed(const Duration(milliseconds: 500), () {
      js.context.callMethod('startYoloDetection', [_containerId]);
    });
  }

  @override
  Widget build(BuildContext context) {
    return _buildLayout(
      moduleTitle: 'Tarea 2 — Detección de Objetos YOLO',
      moduleSubtitle: 'YOLO (You Only Look Once) — Redmon et al. (2016)\nDetección multi-objeto en tiempo real con dataset COCO (80 clases)',
      icon: Icons.center_focus_strong,
      accentColor: const Color(0xFF7B2FBE),
      buttonLabel: 'Iniciar Cámara y Detección YOLO',
      buttonIcon: Icons.videocam,
      containerId: 'yolo-container',
      started: _started,
      onStart: _startDetection,
      infoChips: const [
        _InfoChip(label: 'ml5.js YOLO', icon: Icons.auto_awesome),
        _InfoChip(label: 'Dataset COCO 80 clases', icon: Icons.category),
        _InfoChip(label: 'Bounding Boxes', icon: Icons.crop_square),
        _InfoChip(label: 'Tiempo Real', icon: Icons.speed),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout compartido para ambos módulos
// ─────────────────────────────────────────────────────────────────────────────
Widget _buildLayout({
  required String moduleTitle,
  required String moduleSubtitle,
  required IconData icon,
  required Color accentColor,
  required String buttonLabel,
  required IconData buttonIcon,
  required String containerId,
  required bool started,
  required VoidCallback onStart,
  required List<Widget> infoChips,
}) {
  return Container(
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF060D1A), Color(0xFF0D1B2A)],
      ),
    ),
    child: Column(
      children: [
        // Header del módulo
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          decoration: BoxDecoration(
            color: accentColor.withOpacity(0.07),
            border: Border(bottom: BorderSide(color: accentColor.withOpacity(0.3), width: 1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, color: accentColor, size: 22),
                  const SizedBox(width: 10),
                  Text(
                    moduleTitle,
                    style: TextStyle(
                      color: accentColor,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                moduleSubtitle,
                style: const TextStyle(
                  color: Color(0xFF5E8EA4),
                  fontSize: 12,
                  fontFamily: 'Roboto Mono',
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, children: infoChips),
            ],
          ),
        ),

        // Botón de inicio (solo cuando no ha comenzado)
        if (!started)
          Padding(
            padding: const EdgeInsets.only(top: 24, bottom: 8),
            child: ElevatedButton.icon(
              onPressed: onStart,
              icon: Icon(buttonIcon, size: 20),
              label: Text(buttonLabel, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              style: ElevatedButton.styleFrom(
                backgroundColor: accentColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 8,
                shadowColor: accentColor.withOpacity(0.5),
              ),
            ),
          ),

        // Vista de cámara / detección
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 900),
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF0A0A1A),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: accentColor.withOpacity(0.3), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: accentColor.withOpacity(0.15),
                    blurRadius: 24,
                    spreadRadius: 2,
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: started
                  ? HtmlElementView(viewType: containerId)
                  : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.videocam_off, size: 56, color: accentColor.withOpacity(0.3)),
                          const SizedBox(height: 12),
                          Text(
                            'Presiona el botón para iniciar',
                            style: TextStyle(color: accentColor.withOpacity(0.5), fontSize: 14, fontFamily: 'Roboto Mono'),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
        ),
      ],
    ),
  );
}

// Chip de información de tecnología
class _InfoChip extends StatelessWidget {
  final String label;
  final IconData icon;
  const _InfoChip({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF90E0EF)),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFF90E0EF),
              fontFamily: 'Roboto Mono',
            ),
          ),
        ],
      ),
    );
  }
}
