<script setup lang="ts">
import { CIcon } from '@coreui/icons-vue';
</script>

<template>
    <!-- The below lifted directly from the generated markup in my coreui repo -->
    <!-- In the real version we should use CoreUI Vue components, not coreui flavoured markup -->
    
    <header class="header header-sticky p-0 mb-4">
        <div class="container-fluid border-bottom px-4 justify-content-start">
          <button class="header-toggler" type="button" onclick="coreui.Sidebar.getInstance(document.querySelector('#sidebar')).toggle()" style="margin-inline-start: -14px;">
            <CIcon icon="cilMenu" size="lg"/>
          </button><a class="fw-semibold fs-5 ms-2 link-underline link-underline-opacity-0" href="#">DAEDALUS Explore</a>
          <div class="ms-5 d-none d-xxl-block">
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb my-0">
                <li class="breadcrumb-item"><a href="#">Base scenario</a>
                </li>
                <li class="breadcrumb-item"><a href="#">Explore more scenarios</a>
                </li>
                <li class="breadcrumb-item active"><span>By policy response</span>
                </li>
              </ol>
            </nav>
          </div>
          <div class="d-none d-xxl-block ms-auto mt-2">
            <div class="progress-group">
              <div class="progress-group-header">
                <div>Analyses in progress</div>
                <div class="ms-5">1 of 4 completed</div>
              </div>
              <div class="progress-group-bars"> 
                <div class="progress">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width: 20%"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="d-xxl-none ms-auto fixed-bottom bg-body p-3 pb-2 border-start border-top rounded-start-3 shadow-lg" style="max-width: 728px">
            <div class="progress-group">
              <div class="progress-group-header">
                <div>Analyses in progress</div>
                <div class="ms-5">1 of 4 completed</div>
              </div>
              <div class="progress-group-bars"> 
                <div class="progress">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width: 20%"></div>
                </div>
              </div>
            </div>
          </div>
          <ul class="header-nav ms-auto d-xxl-none">
            <li class="nav-item py-1">
              <div class="vr h-100 mx-2 text-body text-opacity-75"></div>
            </li>
            <li class="nav-item"><a class="nav-link" href="#">
                <CIcon icon="cilCloudDownload" size="lg"/>
            </a></li>
            <li class="nav-item py-1">
              <div class="vr h-100 mx-2 text-body text-opacity-75"></div>
            </li>
            <li class="nav-item"><a class="nav-link" href="#"> ?</a></li>
          </ul>
        </div>
        <div class="container-fluid px-3 d-xxl-none" style="font-size: 0.74rem">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb my-0">
              <li class="breadcrumb-item"><a href="#">Base scenario</a>
              </li>
              <li class="breadcrumb-item"><a href="#">Explore more scenarios</a>
              </li>
              <li class="breadcrumb-item active"><span>By policy response</span>
              </li>
            </ol>
          </nav>
        </div>
      </header>
</template>